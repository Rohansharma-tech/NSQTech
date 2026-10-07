import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { UserStateService } from '../../../core/services/user-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private userState = inject(UserStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly sessionExpired = signal(false);

  readonly form = this.fb.group({
    userId: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(1)]],
    role: ['general' as 'admin' | 'general', Validators.required],
  });

  readonly delayMs = signal(0);
  readonly delayPresets = [0, 1000, 3000, 5000, 10000];

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionExpired.set(true);
    }
  }

  get userIdCtrl() { return this.form.controls['userId']; }
  get passwordCtrl() { return this.form.controls['password']; }
  get roleCtrl() { return this.form.controls['role']; }

  setDelay(ms: number): void {
    this.delayMs.set(ms);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  quickFill(role: 'admin' | 'general'): void {
    if (role === 'admin') {
      this.form.patchValue({ userId: 'admin01', password: 'Admin@123', role: 'admin' });
    } else {
      this.form.patchValue({ userId: 'user01', password: 'User@123', role: 'general' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.errorMessage.set('');
    this.isLoading.set(true);

    const { userId, password, role } = this.form.value as {
      userId: string;
      password: string;
      role: 'admin' | 'general';
    };

    this.authApi
      .login({ userId, password, role }, this.delayMs())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.userState.login(data.user, data.token);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const msg = err?.error?.error || 'Invalid credentials. Please try again.';
          this.errorMessage.set(msg);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
