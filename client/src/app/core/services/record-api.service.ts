import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Record, RecordFilter } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class RecordApiService {
  private readonly base = `${environment.apiUrl}/records`;

  constructor(private http: HttpClient) {}

  getRecords(filter: RecordFilter = {}): Observable<ApiResponse<Record[]>> {
    let params = new HttpParams();
    if (filter.search) params = params.set('search', filter.search);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.priority) params = params.set('priority', filter.priority);
    if (filter.page) params = params.set('page', String(filter.page));
    if (filter.limit) params = params.set('limit', String(filter.limit));
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortOrder) params = params.set('sortOrder', filter.sortOrder);
    if (filter.delay && filter.delay > 0) params = params.set('delay', String(filter.delay));

    return this.http.get<ApiResponse<Record[]>>(this.base, { params });
  }
}
