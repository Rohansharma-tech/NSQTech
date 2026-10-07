import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, User, CreateUserRequest, UpdateUserRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(delay?: number): Observable<User[]> {
    const params = delay ? new HttpParams().set('delay', String(delay)) : undefined;
    return this.http
      .get<ApiResponse<User[]>>(this.base, { params })
      .pipe(map((res) => res.data!));
  }

  create(data: CreateUserRequest, delay?: number): Observable<User> {
    const params = delay ? new HttpParams().set('delay', String(delay)) : undefined;
    return this.http
      .post<ApiResponse<User>>(this.base, data, { params })
      .pipe(map((res) => res.data!));
  }

  update(id: string, data: UpdateUserRequest, delay?: number): Observable<User> {
    const params = delay ? new HttpParams().set('delay', String(delay)) : undefined;
    return this.http
      .put<ApiResponse<User>>(`${this.base}/${id}`, data, { params })
      .pipe(map((res) => res.data!));
  }

  delete(id: string, delay?: number): Observable<void> {
    const params = delay ? new HttpParams().set('delay', String(delay)) : undefined;
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${id}`, { params })
      .pipe(map(() => void 0));
  }

  toggleStatus(id: string, delay?: number): Observable<User> {
    const params = delay ? new HttpParams().set('delay', String(delay)) : undefined;
    return this.http
      .patch<ApiResponse<User>>(`${this.base}/${id}/toggle-status`, {}, { params })
      .pipe(map((res) => res.data!));
  }
}
