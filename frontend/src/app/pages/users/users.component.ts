import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UsersService, UserDto, CreateUserDto, UpdateUserDto } from '../../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
  <div class="max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900">Consulta de Usuários</h1>

    <!-- Filtro + Ações -->
    <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex w-full sm:max-w-2xl">
        <input [(ngModel)]="q" (ngModelChange)="onSearchChange()" type="text"
               placeholder="Pesquisar por nome ou e-mail"
               class="flex-1 h-12 px-4 rounded-l-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <button class="h-12 w-12 grid place-items-center rounded-r-xl border border-l-0 border-gray-300 text-gray-500 hover:bg-gray-50"
                title="Pesquisar" (click)="load(1)">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
        </button>
      </div>

      <div class="flex gap-3">
        <button type="button" (click)="openCreateModal()"
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
              <th class="text-left font-semibold px-6 py-4">NOME</th>
              <th class="text-left font-semibold px-6 py-4">E-MAIL</th>
              <th class="text-left font-semibold px-6 py-4">CRIADO EM</th>
              <th class="text-left font-semibold px-6 py-4">ATUALIZADO EM</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let u of users()" class="hover:bg-gray-50 cursor-pointer" (click)="openEditModal(u)">
              <td class="px-6 py-4 text-gray-900">{{ u.name }}</td>
              <td class="px-6 py-4 text-gray-900">{{ u.email }}</td>
              <td class="px-6 py-4 text-gray-900">{{ u.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="px-6 py-4 text-gray-900">{{ u.updated_at | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 rounded-md hover:bg-gray-100" title="Editar" (click)="$event.stopPropagation(); openEditModal(u)">
                  <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-0.92l8.06-8.06 0.92 0.92L5.92 20.08ZM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82Z"/>
                  </svg>
                </button>
              </td>
            </tr>

            <tr *ngIf="users().length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">Nenhum usuário encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Paginação -->
    <div class="mt-6 flex items-center justify-center gap-2">
      <button class="h-9 min-w-9 px-3 rounded-md bg-white border border-gray-300 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              (click)="first()" [disabled]="page()===1" title="Primeira">«</button>
      <button class="h-9 min-w-9 px-3 rounded-md bg-white border border-gray-300 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              (click)="prev()"  [disabled]="page()===1" title="Anterior">‹</button>

      <span class="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold px-3">
        {{ page() }} / {{ totalPages() }}
      </span>

      <button class="h-9 min-w-9 px-3 rounded-md bg-white border border-gray-300 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              (click)="next()" [disabled]="page()===totalPages()" title="Próxima">›</button>
      <button class="h-9 min-w-9 px-3 rounded-md bg-white border border-gray-300 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              (click)="last()" [disabled]="page()===totalPages()" title="Última">»</button>
    </div>
  </div>

  <!-- Modal Cadastrar -->
  <div *ngIf="showCreate()" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" (click)="closeCreate()" aria-hidden="true"></div>

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">Cadastrar Usuário</h3>
          <button (click)="closeCreate()" class="p-2 rounded-md hover:bg-gray-100" aria-label="Fechar">
            <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="createForm" (ngSubmit)="saveCreate()" class="px-5 py-6 space-y-4">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Nome</label>
            <input formControlName="nome" type="text"
                   class="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                   placeholder="Nome completo" />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">E-mail</label>
            <input formControlName="email" type="email"
                   class="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                   placeholder="email@exemplo.com" />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Senha</label>
            <div class="flex">
              <input formControlName="password" type="text"
                     class="flex-1 h-11 px-3 rounded-l-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                     placeholder="Defina uma senha" />
              <button type="button" (click)="generatePassword()"
                      class="h-11 px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100">
                Gerar
              </button>
            </div>
            <small class="text-xs text-gray-500">Gera uma senha forte aleatória.</small>
          </div>

          <div class="pt-2 flex justify-end gap-2 border-t">
            <button type="button" (click)="closeCreate()"
                    class="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" [disabled]="createForm.invalid || savingCreate()"
                    class="h-10 px-4 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-60 flex items-center gap-2">
              <span *ngIf="savingCreate()" class="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Modal Editar (com Excluir) -->
  <div *ngIf="showEdit()" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" (click)="closeEdit()" aria-hidden="true"></div>

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">Editar Usuário</h3>
          <button (click)="closeEdit()" class="p-2 rounded-md hover:bg-gray-100" aria-label="Fechar">
            <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="px-5 py-6 space-y-4">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Nome</label>
            <input formControlName="nome" type="text"
                   class="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">E-mail</label>
            <input formControlName="email" type="email"
                   class="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div class="pt-2 flex items-center justify-between gap-2 border-t">
            <button type="button" (click)="onDelete()"
                    class="h-10 px-4 rounded-lg bg-red-600 text-white font-medium disabled:opacity-60 flex items-center gap-2"
                    [disabled]="deleting()">
              <span *ngIf="deleting()" class="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
              Excluir
            </button>

            <div class="flex gap-2">
              <button type="button" (click)="closeEdit()"
                      class="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" [disabled]="editForm.invalid || savingEdit()"
                      class="h-10 px-4 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-60 flex items-center gap-2">
                <span *ngIf="savingEdit()" class="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
  `,
})
export default class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersApi = inject(UsersService);
  private toast = inject(ToastrService);

  q = signal<string>('');
  users = signal<UserDto[]>([]);
  page = signal<number>(1);
  totalPages = signal<number>(1);
  perPage = 10;

  // CREATE
  showCreate = signal(false);
  savingCreate = signal(false);
  createForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // EDIT
  showEdit = signal(false);
  savingEdit = signal(false);
  deleting = signal(false);
  selectedId = signal<number | null>(null);
  editForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void { this.load(1); }

  onSearchChange(){ this.load(1); }

  load(p = this.page()) {
    this.usersApi.list(p, this.perPage, this.q()).subscribe({
      next: (resp) => {
        this.users.set(resp.data);
        this.page.set(resp.current_page);
        this.totalPages.set(resp.last_page);
      },
      error: () => this.toast.error('Falha ao carregar usuários'),
    });
  }

  first(){ this.load(1); }
  prev(){ if (this.page() > 1) this.load(this.page() - 1); }
  next(){ if (this.page() < this.totalPages()) this.load(this.page() + 1); }
  last(){ this.load(this.totalPages()); }

  // CREATE modal
  openCreateModal(){ this.createForm.reset(); this.showCreate.set(true); }
  closeCreate(){ this.showCreate.set(false); }

  saveCreate(){
    if (this.createForm.invalid || this.savingCreate()) return;
    const v = this.createForm.value as { nome: string; email: string; password: string; };
    const payload: CreateUserDto = { name: v.nome, email: v.email, password: v.password };
    this.savingCreate.set(true);
    this.usersApi.create(payload).subscribe({
      next: () => {
        this.savingCreate.set(false);
        this.closeCreate();
        this.toast.success('Usuário cadastrado com sucesso!');
        this.load(1);
      },
      error: (err) => {
        this.savingCreate.set(false);
        this.toast.error(err?.error?.message || 'Falha ao cadastrar usuário.');
      }
    });
  }

  // EDIT modal
  openEditModal(u: UserDto){
    this.selectedId.set(u.id);
    this.editForm.patchValue({ nome: u.name, email: u.email });
    this.showEdit.set(true);
  }
  closeEdit(){ this.showEdit.set(false); this.selectedId.set(null); }

  saveEdit(){
    if (this.editForm.invalid || this.savingEdit() || this.selectedId() === null) return;
    const id = this.selectedId()!;
    const v = this.editForm.value as { nome: string; email: string; };
    const payload: UpdateUserDto = { name: v.nome, email: v.email };

    this.savingEdit.set(true);
    this.usersApi.update(id, payload).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(x => x.id === id ? { ...x, ...updated } : x));
        this.savingEdit.set(false);
        this.closeEdit();
        this.toast.success('Usuário atualizado com sucesso!');
      },
      error: (err) => {
        this.savingEdit.set(false);
        this.toast.error(err?.error?.message || 'Falha ao atualizar usuário.');
      }
    });
  }

  onDelete(){
    if (this.selectedId() === null) return;
    const id = this.selectedId()!;
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    this.deleting.set(true);
    this.usersApi.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeEdit();
        this.users.update(list => list.filter(x => x.id !== id));
        this.toast.success('Usuário excluído com sucesso!');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err?.error?.message || 'Falha ao excluir usuário.');
      }
    });
  }

  generatePassword(len = 12){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}?';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    this.createForm.get('password')?.setValue(out);
  }
}
