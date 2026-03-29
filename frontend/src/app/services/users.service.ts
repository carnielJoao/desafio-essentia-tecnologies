import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

export type UserDto = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserDto = { name: string; email: string; password: string; };
export type UpdateUserDto = { name: string; email: string; };

export type UsersPage = {
  data: UserDto[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private token = inject(TokenStorageService);
  private base = 'http://127.0.0.1:8000/api';

  private httpOptionsJson() {
    const t = this.token.getToken();
    const headers = t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
    return { headers, responseType: 'json' as const };
  }

  list(page = 1, perPage = 10, q = ''): Observable<UsersPage> {
    const params = new HttpParams().set('page', String(page)).set('per_page', String(perPage)).set('q', q);
    return this.http.get<UsersPage>(`${this.base}/users`, { ...this.httpOptionsJson(), params });
  }

  create(data: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.base}/users`, data, this.httpOptionsJson());
  }

  update(id: number, data: UpdateUserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/users/${id}`, data, this.httpOptionsJson());
  }

  delete(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/users/${id}`, this.httpOptionsJson());
  }
}
