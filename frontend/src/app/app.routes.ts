import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component') },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'todos' },
      { path: 'todos', loadComponent: () => import('./pages/todos/todos.component') },
      { path: 'usuarios', loadComponent: () => import('./pages/users/users.component') },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
