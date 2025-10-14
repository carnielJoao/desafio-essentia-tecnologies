import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

export interface Todo {
  id: number | string;
  title: string;
  description?: string | null;
  done: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private token = inject(TokenStorageService);
  private base = 'http://127.0.0.1:3001/api/todos';

  private headers(): HttpHeaders {
    const t = this.token.getToken();
    return new HttpHeaders(t ? { Authorization: `Bearer ${t}` } : {});
  }

  list(opts: { page?: number; per_page?: number; search?: string; done?: boolean }): Observable<Paginated<Todo>> {
    let p = new HttpParams();
    if (opts.page) p = p.set('page', opts.page);
    if (opts.per_page) p = p.set('per_page', opts.per_page);
    if (opts.search) p = p.set('search', opts.search);
    if (opts.done !== undefined) p = p.set('done', String(opts.done));
    return this.http.get<Paginated<Todo>>(this.base, { params: p, headers: this.headers() });
  }

  create(payload: { title: string; description?: string | null }) {
    return this.http.post<Todo>(this.base, payload, { headers: this.headers() });
  }

  update(id: number | string, payload: Partial<Todo>) {
    return this.http.put<Todo>(`${this.base}/${id}`, payload, { headers: this.headers() });
  }

  remove(id: number | string) {
    return this.http.delete<{ deleted: true }>(`${this.base}/${id}`, { headers: this.headers() });
  }
}
