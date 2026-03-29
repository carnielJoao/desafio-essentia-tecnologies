import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type LoginRequest = { email: string; password: string };
type LoginResponse = {
  token: string;
  expires_in: number;
  user: { id: number; name: string; email: string };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.authApi;

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, data);
  }
}
