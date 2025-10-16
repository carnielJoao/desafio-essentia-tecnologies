import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export type AuditAction = 'create' | 'update' | 'delete' | 'done' | 'undone';

export interface AuditEvent {
  _id?: string;
  todo_id: number;
  user_id: number;
  action: AuditAction;
  timestamp: string; 
  meta?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);
  private base = 'http://127.0.0.1:3001/api/todos';

  list(opts: { page?: number; per_page?: number; search?: string; done?: boolean }): Observable<Paginated<Todo>> {
    let p = new HttpParams();
    if (opts.page) p = p.set('page', opts.page);
    if (opts.per_page) p = p.set('per_page', opts.per_page);
    if (opts.search) p = p.set('search', opts.search);
    if (opts.done !== undefined) p = p.set('done', String(opts.done));
    return this.http.get<Paginated<Todo>>(this.base, { params: p });
  }

  create(payload: { title: string; description?: string | null }) {
    return this.http.post<Todo>(this.base, payload);
  }

  update(id: number | string, payload: Partial<Todo>) {
    return this.http.put<Todo>(`${this.base}/${id}`, payload);
  }

  remove(id: number | string) {
    return this.http.delete<{ deleted: true }>(`${this.base}/${id}`);
  }

  audit(todoId: number | string, page = 1, per_page = 10) {
    let p = new HttpParams().set('page', page).set('per_page', per_page);
    return this.http.get<Paginated<AuditEvent>>(`${this.base}/${todoId}/audit`, { params: p });
  }
}
