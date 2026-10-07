import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest, delay?: number): Observable<LoginResponse> {
    const params: Record<string, string> = {};
    if (delay && delay > 0) params['delay'] = String(delay);

    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.base}/login`, credentials, { params })
      .pipe(map((res) => res.data!));
  }

  getMe(delay?: number): Observable<User> {
    const params: Record<string, string> = {};
    if (delay && delay > 0) params['delay'] = String(delay);

    return this.http
      .get<ApiResponse<User>>(`${this.base}/me`, { params })
      .pipe(map((res) => res.data!));
  }
}
