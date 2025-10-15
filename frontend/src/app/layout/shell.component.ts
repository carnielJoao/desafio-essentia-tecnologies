import { Component, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TokenStorageService } from '../services/token-storage.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar (fixo no fluxo) -->
    <aside
      class="min-h-full bg-white border-r border-gray-200 transition-[width] duration-200 ease-in-out flex flex-col"
      [class.w-64]="open()"
      [class.w-16]="!open()"
    >
      <!-- Top bar -->
      <div class="flex items-center justify-between px-4 h-14 border-b">
        <a routerLink="/app/todos"
           class="text-lg font-bold text-blue-600 truncate"
           [class.opacity-0]="!open()"
           [class.pointer-events-none]="!open()">
          TechX
        </a>

        <button
          type="button"
          (click)="toggle()"
          class="p-2 rounded-md text-blue-600 hover:bg-blue-50"
          aria-label="Alternar menu"
          [attr.title]="open() ? 'Recolher' : 'Expandir'"
        >
          <!-- Ícone hamburguer -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-current">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/>
          </svg>
        </button>
      </div>

      <!-- Links -->
      <nav class="p-2 space-y-1 overflow-y-auto">
        <!-- TODOS -->
        <a
          routerLink="/app/todos"
          routerLinkActive="bg-blue-50 text-blue-700"
          class="group flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          [attr.title]="!open() ? 'Todos' : null"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               class="w-5 h-5 shrink-0 fill-current text-gray-500 group-[.router-link-active]:text-blue-700">
            <path d="M7 5h14v2H7V5Zm0 6h14v2H7v-2Zm0 6h14v2H7v-2ZM3 5h2v2H3V5Zm0 6h2v2H3v-2Zm0 6h2v2H3v-2Z"/>
          </svg>
          <span class="whitespace-nowrap transition-opacity"
                [class.opacity-0]="!open()" [class.pointer-events-none]="!open()">
            Todos
          </span>
        </a>

        <!-- USUÁRIOS -->
        <a
          routerLink="/app/usuarios"
          routerLinkActive="bg-blue-50 text-blue-700"
          class="group flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          [attr.title]="!open() ? 'Usuários' : null"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               class="w-5 h-5 shrink-0 fill-current text-gray-500 group-[.router-link-active]:text-blue-700">
            <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.94 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"/>
          </svg>
          <span class="whitespace-nowrap transition-opacity"
                [class.opacity-0]="!open()" [class.pointer-events-none]="!open()">
            Usuários
          </span>
        </a>
      </nav>

      <!-- Rodapé: Sair -->
      <div class="mt-auto p-2 border-t">
        <button
          type="button"
          (click)="logout()"
          class="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-red-700 hover:bg-red-50"
          [attr.title]="!open() ? 'Sair' : null"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 17v-2h4V9h-4V7h6v10h-6Zm-2 2H4V5h4V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4v-2Z"/>
          </svg>
          <span class="whitespace-nowrap transition-opacity"
                [class.opacity-0]="!open()" [class.pointer-events-none]="!open()">
            Sair
          </span>
        </button>
      </div>
    </aside>

    <!-- Conteúdo (sem padding lateral fixo) -->
    <main class="flex-1 p-6 overflow-auto">
      <div class="h-10 mb-2 flex items-center bg-gradient-to-b from-gray-100 to-transparent"></div>
      <router-outlet></router-outlet>
    </main>
  </div>
  `,
})
export default class ShellComponent {
  open = signal<boolean>(localStorage.getItem('sx_sidebar_open') !== '0');

  private router = inject(Router);
  private token = inject(TokenStorageService);
  private toast = inject(ToastrService);

  constructor() {
    effect(() => localStorage.setItem('sx_sidebar_open', this.open() ? '1' : '0'));
  }

  toggle() { this.open.set(!this.open()); }

  logout() {
    (this.token as any).clear?.();
    this.token.setToken('');
    this.token.setUser(null as any);
    this.toast.info('Sessão encerrada.');
    this.router.navigate(['/login']);
  }
}
