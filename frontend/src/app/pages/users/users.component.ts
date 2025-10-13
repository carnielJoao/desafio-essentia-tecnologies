import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type User = {
  id: number;
  nome: string;
  email: string;
  grupos: string[];
  papel: 'Administrador' | 'Operador' | 'Leitor';
  ativo: boolean;
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-7xl mx-auto">
    <!-- Título -->
    <h1 class="text-2xl font-bold text-gray-900">Consulta de Usuários</h1>

    <!-- Filtro + Ações -->
    <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex w-full sm:max-w-2xl">
        <input [(ngModel)]="q" (ngModelChange)="goFirst()"
               type="text" placeholder="Pesquisar por nome ou e-mail"
               class="flex-1 h-12 px-4 rounded-l-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <button class="h-12 w-12 grid place-items-center rounded-r-xl border border-l-0 border-gray-300 text-gray-500 hover:bg-gray-50"
                title="Pesquisar">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
        </button>
      </div>

      <div class="flex gap-3">
        <button type="button"
                (click)="openModal()"
                class="h-12 px-5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
          Cadastrar
        </button>
      </div>
    </div>

    <!-- Tabela -->
    <section class="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-gray-500">
              <th class="text-left font-semibold px-6 py-4">FOTO</th>
              <th class="text-left font-semibold px-6 py-4">NOME</th>
              <th class="text-left font-semibold px-6 py-4">E-MAIL</th>
              <th class="text-left font-semibold px-6 py-4">GRUPOS</th>
              <th class="text-left font-semibold px-6 py-4">PAPEL</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let u of paged()" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="w-10 h-10 rounded-full bg-gray-200 grid place-items-center text-xs text-gray-600"
                     [title]="u.nome">
                  {{ initials(u.nome) }}
                </div>
              </td>
              <td class="px-6 py-4 text-gray-900">
                <div class="leading-5">{{ u.nome }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-gray-900">{{ u.email }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-gray-900 truncate max-w-[34ch]" [title]="u.grupos.join(', ')">
                  {{ u.grupos.join(', ') }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-gray-900">{{ u.papel }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 rounded-md hover:bg-gray-100" title="Abrir">
                  <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.29 6.71 13.58 11l-4.29 4.29L10 17l6-6-6-6-0.71 0.71Z"/>
                  </svg>
                </button>
              </td>
            </tr>

            <tr *ngIf="paged().length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">Nenhum usuário encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Paginação -->
    <div class="mt-6 flex items-center justify-center gap-2">
      <button class="btnPage" (click)="first()" [disabled]="page()===1" title="Primeira">«</button>
      <button class="btnPage" (click)="prev()"  [disabled]="page()===1" title="Anterior">‹</button>

      <span class="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold px-3">
        {{ page() }}
      </span>

      <button class="btnPage" (click)="next()" [disabled]="page()===totalPages()" title="Próxima">›</button>
      <button class="btnPage" (click)="last()" [disabled]="page()===totalPages()" title="Última">»</button>
    </div>
  </div>

  <!-- Modal Cadastrar -->
  <div *ngIf="showModal()" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" (click)="closeModal()" aria-hidden="true"></div>

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">Cadastrar Usuário</h3>
          <button (click)="closeModal()" class="p-2 rounded-md hover:bg-gray-100" aria-label="Fechar">
            <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z"/>
            </svg>
          </button>
        </div>

        <div class="px-5 py-6">
          <p class="text-gray-700">infos</p>
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button (click)="closeModal()" class="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Fechar
          </button>
          <button class="h-10 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .btnPage{ @apply h-9 min-w-9 px-3 rounded-md bg-white border border-gray-300 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50; }
  `]
})
export default class UsersComponent {

  q = signal<string>('');
  page = signal<number>(1);
  pageSize = 10;

  showModal = signal(false);
  openModal(){ this.showModal.set(true); }
  closeModal(){ this.showModal.set(false); }

  users = signal<User[]>([
    {
      id: 1,
      nome: 'João Victor Carniel',
      email: 'admin@fidesoft.com.br',
      grupos: ['Administração', 'Comunicação', 'Controle & Comp', 'Camboriú Prefeitura'],
      papel: 'Administrador',
      ativo: true,
    },
  ]);

  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.users().filter(u =>
      !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  paged = computed(() => {
    const p = this.page();
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  goFirst(){ this.page.set(1); }
  first(){ this.page.set(1); }
  last(){ this.page.set(this.totalPages()); }
  prev(){ if (this.page() > 1) this.page.update(p => p - 1); }
  next(){ if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  initials(nome: string){
    return nome.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase();
  }
}
