import { Injectable } from '@angular/core';

const KEY = 'auth_token';
const USER = 'auth_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setToken(token: string) {
    localStorage.setItem(KEY, token);
  }
  getToken(): string | null {
    return localStorage.getItem(KEY);
  }
  setUser(user: unknown) {
    localStorage.setItem(USER, JSON.stringify(user));
  }
  getUser<T = any>(): T | null {
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(USER);
  }
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
