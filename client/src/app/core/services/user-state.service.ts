import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser() && !!this._token());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  setUser(user: User | null): void {
    this._currentUser.set(user);
  }

  setToken(token: string | null): void {
    this._token.set(token);
    if (token) {
      localStorage.setItem('mploycheck_token', token);
    } else {
      localStorage.removeItem('mploycheck_token');
    }
  }

  login(user: User, token: string): void {
    this.setToken(token);
    this.setUser(user);
    localStorage.setItem('mploycheck_user', JSON.stringify(user));
  }

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem('mploycheck_token');
    localStorage.removeItem('mploycheck_user');
  }

  restoreSession(): { token: string; user: User } | null {
    const token = localStorage.getItem('mploycheck_token');
    const userJson = localStorage.getItem('mploycheck_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._token.set(token);
        this._currentUser.set(user);
        return { token, user };
      } catch {
        this.logout();
        return null;
      }
    }
    return null;
  }
}
