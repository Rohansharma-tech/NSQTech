import {
  Component, inject, signal, OnInit, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { UserApiService } from '../../core/services/user-api.service';
import { UserStateService } from '../../core/services/user-state.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../../shared/models';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private userApi = inject(UserApiService);
  userState = inject(UserStateService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  readonly modalMode = signal<ModalMode>(null);
  readonly selectedUser = signal<User | null>(null);

  readonly searchTerm = signal('');
  readonly filterRole = signal('');
  readonly filterStatus = signal('');

  readonly form = this.fb.group({
    userId: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    role: ['general', Validators.required],
    accessLevel: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
  });

  get filteredUsers(): User[] {
    return this.users().filter((u) => {
      const term = this.searchTerm().toLowerCase();
      const matchSearch = !term ||
        u.name.toLowerCase().includes(term) ||
        u.userId.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchRole = !this.filterRole() || u.role === this.filterRole();
      const matchStatus = !this.filterStatus() ||
        (this.filterStatus() === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userApi.getAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => this.showError('Failed to load users'),
      });
  }

  openCreate(): void {
    this.form.reset({ role: 'general', accessLevel: 1 });
    this.form.get('userId')?.enable();
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.selectedUser.set(null);
    this.modalMode.set('create');
  }

  openEdit(user: User): void {
    this.form.patchValue({
      userId: user.userId,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      accessLevel: user.accessLevel,
    });
    this.form.get('userId')?.disable();
    this.form.get('password')?.setValidators([Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.selectedUser.set(user);
    this.modalMode.set('edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedUser.set(null);
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid || this.actionLoading()) return;

    const val = this.form.getRawValue();
    this.actionLoading.set(true);

    if (this.modalMode() === 'create') {
      const body: CreateUserRequest = {
        userId: val.userId!,
        name: val.name!,
        email: val.email!,
        password: val.password!,
        role: val.role as 'admin' | 'general',
        accessLevel: val.accessLevel!,
      };
      this.userApi.create(body)
        .pipe(finalize(() => this.actionLoading.set(false)))
        .subscribe({
          next: (user) => {
            this.users.update((list) => [user, ...list]);
            this.showSuccess(`User ${user.userId} created`);
            this.closeModal();
          },
          error: (err) => this.showError(err?.error?.error || 'Failed to create user'),
        });
    } else {
      const body: UpdateUserRequest = {};
      if (val.name) body.name = val.name;
      if (val.email) body.email = val.email;
      if (val.password) body.password = val.password;
      if (val.role) body.role = val.role as 'admin' | 'general';
      if (val.accessLevel) body.accessLevel = val.accessLevel;

      this.userApi.update(this.selectedUser()!._id, body)
        .pipe(finalize(() => this.actionLoading.set(false)))
        .subscribe({
          next: (updated) => {
            this.users.update((list) => list.map((u) => u._id === updated._id ? updated : u));
            this.showSuccess(`User ${updated.userId} updated`);
            this.closeModal();
          },
          error: (err) => this.showError(err?.error?.error || 'Failed to update user'),
        });
    }
  }

  toggleStatus(user: User): void {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    this.userApi.toggleStatus(user._id)
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => u._id === updated._id ? updated : u));
          this.showSuccess(`User ${updated.userId} ${updated.isActive ? 'activated' : 'deactivated'}`);
        },
        error: (err) => this.showError(err?.error?.error || 'Failed to toggle status'),
      });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete user "${user.name}" (${user.userId})? This cannot be undone.`)) return;
    this.actionLoading.set(true);
    this.userApi.delete(user._id)
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => {
          this.users.update((list) => list.filter((u) => u._id !== user._id));
          this.showSuccess(`User ${user.userId} deleted`);
        },
        error: (err) => this.showError(err?.error?.error || 'Failed to delete user'),
      });
  }

  isSelf(user: User): boolean {
    return this.userState.currentUser()?._id === user._id;
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    this.errorMsg.set('');
    setTimeout(() => this.successMsg.set(''), 4000);
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    this.successMsg.set('');
    setTimeout(() => this.errorMsg.set(''), 6000);
  }
}
