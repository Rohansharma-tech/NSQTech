import {
  Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, switchMap, catchError, finalize, timeout
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStateService } from '../../core/services/user-state.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { RecordApiService } from '../../core/services/record-api.service';
import { ApiResponse, Record as MployRecord, Pagination, RecordFilter } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  userState = inject(UserStateService);
  private authApi = inject(AuthApiService);
  private recordApi = inject(RecordApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // ── State signals ─────────────────────────────────────────────────────────
  readonly profileLoading = signal(true);
  readonly recordsLoading = signal(false);
  readonly profileError = signal('');
  readonly recordsError = signal('');
  readonly timedOut = signal(false);

  readonly records = signal<MployRecord[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly delayMs = signal(0);
  readonly delayPresets = [0, 500, 1000, 3000, 5000];

  // ── Filter state ──────────────────────────────────────────────────────────
  readonly searchCtrl = new FormControl('');
  readonly filterCategory = signal('');
  readonly filterStatus = signal('');
  readonly filterPriority = signal('');
  readonly currentPage = signal(1);
  readonly sortBy = signal('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly pageLimit = 8;

  readonly isAdmin = computed(() => this.userState.isAdmin());
  readonly currentUser = computed(() => this.userState.currentUser());
  readonly activeCount = computed(() => this.records().filter(r => r.status === 'active').length);
  readonly pendingCount = computed(() => this.records().filter(r => r.status === 'pending').length);

  readonly categories = ['', 'HR', 'Finance', 'Operations', 'IT', 'Legal', 'Compliance'];
  readonly statuses = ['', 'active', 'pending', 'archived'];
  readonly priorities = ['', 'low', 'medium', 'high', 'critical'];

  private filterChange$ = new Subject<void>();

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSearchDebounce();
    this.setupFilterStream();
  }

  private loadInitialData(): void {
    // If APP_INITIALIZER already restored the user, skip redundant getMe() call
    const userAlreadyLoaded = !!this.userState.currentUser();

    this.recordsLoading.set(true);

    if (userAlreadyLoaded) {
      // Profile already in state — just resolve profileLoading and fetch records
      this.profileLoading.set(false);

      this.recordApi.getRecords(this.buildFilter())
        .pipe(
          catchError(() => of(null)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((records) => {
          this.recordsLoading.set(false);
          if (records) {
            this.records.set(records.data || []);
            this.pagination.set(records.pagination || null);
          } else {
            this.recordsError.set('Failed to load records');
          }
        });
    } else {
      // FR4: forkJoin — profile and records fetched simultaneously on fresh load
      this.profileLoading.set(true);

      forkJoin({
        profile: this.authApi.getMe(this.delayMs()).pipe(catchError(() => of(null))),
        records: this.recordApi.getRecords(this.buildFilter()).pipe(catchError(() => of(null))),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          const res = result as { profile: any; records: ApiResponse<MployRecord[]> | null };

          // Always resolve both loading states regardless of error
          this.profileLoading.set(false);
          this.recordsLoading.set(false);

          if (res.profile) {
            this.userState.setUser(res.profile);
          } else {
            this.profileError.set('Could not load profile. Please refresh.');
          }

          if (res.records) {
            this.records.set(res.records.data || []);
            this.pagination.set(res.records.pagination || null);
          } else {
            this.recordsError.set('Failed to load records');
          }
        });
    }
  }

  private setupSearchDebounce(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.filterChange$.next();
      });
  }

  private setupFilterStream(): void {
    // FR4: switchMap cancels in-flight requests when filters change rapidly
    this.filterChange$
      .pipe(
        switchMap(() => {
          this.recordsLoading.set(true);
          this.recordsError.set('');
          this.timedOut.set(false);

          return this.recordApi.getRecords(this.buildFilter()).pipe(
            timeout(15000),
            catchError((err) => {
              if (err?.name === 'TimeoutError') {
                this.timedOut.set(true);
                this.recordsError.set('Request timed out. Please retry.');
              } else {
                this.recordsError.set('Failed to load records.');
              }
              return of(null);
            }),
            finalize(() => this.recordsLoading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.records.set(res.data || []);
          this.pagination.set(res.pagination || null);
        }
      });
  }

  private buildFilter(): RecordFilter {
    return {
      search: this.searchCtrl.value || undefined,
      category: this.filterCategory() || undefined,
      status: this.filterStatus() || undefined,
      priority: this.filterPriority() || undefined,
      page: this.currentPage(),
      limit: this.pageLimit,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      delay: this.delayMs() || undefined,
    };
  }

  // ── Public actions ────────────────────────────────────────────────────────
  setFilter(field: 'category' | 'status' | 'priority', value: string): void {
    if (field === 'category') this.filterCategory.set(value);
    if (field === 'status') this.filterStatus.set(value);
    if (field === 'priority') this.filterPriority.set(value);
    this.currentPage.set(1);
    this.filterChange$.next();
  }

  setSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortOrder.update((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.filterChange$.next();
  }

  goToPage(page: number): void {
    const total = this.pagination()?.totalPages || 1;
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
    this.filterChange$.next();
  }

  /** Selecting a delay chip immediately re-fetches records to demo async behaviour */
  setDelay(ms: number): void {
    this.delayMs.set(ms);
    this.currentPage.set(1);
    this.filterChange$.next();
  }

  retry(): void {
    this.timedOut.set(false);
    this.filterChange$.next();
  }

  logout(): void {
    this.userState.logout();
    this.router.navigate(['/auth/login']);
  }

  getPageNumbers(): number[] {
    const total = this.pagination()?.totalPages || 1;
    const current = this.currentPage();
    const pages: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageLimit, this.pagination()?.total || 0);
  }

  getPriorityClass(priority: string): string {
    return `badge badge-${priority}`;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active:   'badge badge-active',
      pending:  'badge badge-medium',
      archived: 'badge badge-inactive',
    };
    return map[status] || 'badge';
  }

  getAccessText(): string {
    return this.isAdmin() ? 'Read / Write / Delete' : 'Read';
  }

  /** Smooth-scroll to a section by ID (used by sidebar nav links) */
  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.filterChange$.complete();
  }
}
