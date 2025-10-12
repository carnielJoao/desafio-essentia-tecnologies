import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component') },
  { path: 'todos', canActivate: [authGuard], loadComponent: () => import('./pages/todos/todos.component') },
  { path: '**', redirectTo: 'login' },
];
