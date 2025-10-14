import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TodosService, Todo } from '../../services/todos.service';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
  <div class="max-w-5xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-800 mb-4">Tarefas</h1>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        [formControl]="searchCtrl"
        type="text"
        placeholder="Pesquisar..."
        class="h-10 w-72 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />

      <!-- Interruptor pendentes/concluídos -->
      <button
        type="button"
        (click)="toggleDone()"
        class="h-10 px-3 rounded-lg border flex items-center gap-2"
        [class.border-blue-600]="showDone()"
        [class.text-blue-700]="showDone()"
        [attr.aria-pressed]="showDone()">
        <span class="inline-flex w-9 h-5 rounded-full items-center px-0.5"
              [class.bg-blue-600]="showDone()" [class.bg-gray-300]="!showDone()">
          <span class="inline-block w-4 h-4 bg-white rounded-full transform transition"
                [class.translate-x-4]="showDone()"></span>
        </span>
        {{ showDone() ? 'Concluídos' : 'Pendentes' }}
      </button>

      <button
        type="button"
        (click)="openCreate()"
        class="ml-auto h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold">
        Criar
      </button>
    </div>

    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <div *ngFor="let t of items()" class="rounded-xl border p-4 bg-white">
        <div class="flex items-start justify-between">
          <h3 class="font-semibold text-gray-900">{{ t.title }}</h3>

          <input
            type="checkbox"
            [checked]="t.done"
            (change)="setDone(t, $any($event.target).checked)" />
        </div>

        <p class="text-sm text-gray-600 mt-1" *ngIf="t.description">{{ t.description }}</p>

        <div class="flex gap-2 mt-3">
          <button type="button" class="text-sm px-3 py-1 rounded border" (click)="edit(t)">Editar</button>
          <button
            type="button"
            class="text-sm px-3 py-1 rounded border border-red-300 text-red-700"
            (click)="askRemove(t)">
            Excluir
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-600">
        Página {{ page() }} de {{ lastPage() }} — {{ total() }} itens
      </div>
      <div class="flex gap-2">
        <button type="button" class="px-3 py-1 rounded border"
                [disabled]="page()<=1" (click)="go(page()-1)">Anterior</button>
        <button type="button" class="px-3 py-1 rounded border"
                [disabled]="page()>=lastPage()" (click)="go(page()+1)">Próxima</button>
      </div>
    </div>

    <!-- Modal criar/editar -->
    <div *ngIf="modalOpen()" class="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div class="bg-white rounded-2xl p-5 w-full max-w-md">
        <h2 class="text-lg font-semibold mb-3">{{ editing() ? 'Editar tarefa' : 'Criar tarefa' }}</h2>

        <form (ngSubmit)="save()" class="space-y-3">
          <input
            type="text"
            class="w-full h-10 px-3 rounded border"
            placeholder="Título"
            [(ngModel)]="form.title"
            name="title"
            required />

          <textarea
            class="w-full min-h-24 px-3 py-2 rounded border"
            placeholder="Descrição (opcional)"
            [(ngModel)]="form.description"
            name="description"></textarea>

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="px-3 py-1 rounded border" (click)="close()">Cancelar</button>
            <button type="submit" class="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold">
              {{ editing() ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmar exclusão -->
    <div *ngIf="confirmOpen()" class="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div class="bg-white rounded-2xl p-5 w-full max-w-md" role="dialog" aria-modal="true">
        <h3 class="text-lg font-semibold text-gray-900">Confirmar exclusão</h3>
        <p class="text-gray-600 mt-2">
          Tem certeza que deseja excluir
          <span class="font-medium">"{{ confirmTarget()?.title }}"</span>?
        </p>
        <div class="flex items-center justify-end gap-2 mt-4">
          <button type="button" class="px-3 py-1 rounded border" (click)="cancelRemove()">Cancelar</button>
          <button type="button" class="px-3 py-1 rounded bg-red-600 text-white" (click)="confirmRemove()">Excluir</button>
        </div>
      </div>
    </div>
  </div>
  `,
})
export default class TodosComponent {
  private api = inject(TodosService);
  private fb = inject(FormBuilder);

  items = signal<Todo[]>([]);
  page = signal(1);
  per = signal(12);
  lastPage = signal(1);
  total = signal(0);

  searchCtrl = this.fb.control<string>('');
  showDone = signal(false);

  modalOpen = signal(false);
  editing = signal<Todo | null>(null);
  form: { title: string; description?: string | null } = { title: '', description: '' };

  confirmOpen = signal(false);
  confirmTarget = signal<Todo | null>(null);

  constructor() {
    let timer: any;
    this.searchCtrl.valueChanges.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { this.page.set(1); this.load(); }, 300);
    });

    this.load();

    effect(() => {
      const done = this.showDone();
      this.page.set(1);
      this.fetch(1, this.per(), this.searchCtrl.value ?? '', done);
    });
  }

  toggleDone() { this.showDone.set(!this.showDone()); }

  private fetch(page: number, per: number, search: string, done: boolean) {
    this.api.list({ page, per_page: per, search, done }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.lastPage.set(res.last_page);
        this.total.set(res.total);
      },
      error: (err) => console.error('Erro ao carregar (fetch)', err),
    });
  }

  load() {
    this.api.list({
      page: this.page(),
      per_page: this.per(),
      search: this.searchCtrl.value ?? '',
      done: this.showDone(),
    }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.page.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.total.set(res.total);
      },
      error: (err) => console.error('Erro ao carregar (load)', err),
    });
  }

  go(p: number) {
    const next = Math.max(1, Math.min(p, this.lastPage()));
    this.page.set(next);
    this.load();
  }

  openCreate() {
    this.editing.set(null);
    this.form = { title: '', description: '' };
    this.modalOpen.set(true);
  }

  edit(t: Todo) {
    this.editing.set(t);
    this.form = { title: t.title, description: t.description ?? '' };
    this.modalOpen.set(true);
  }

  close() { this.modalOpen.set(false); }

  save() {
    const editing = this.editing();
    if (editing) {
      this.api.update(editing.id, {
        title: this.form.title,
        description: this.form.description ?? null
      }).subscribe({
        next: () => { this.modalOpen.set(false); this.load(); }
      });
    } else {
      this.api.create({
        title: this.form.title,
        description: this.form.description ?? null
      }).subscribe({
        next: () => { this.modalOpen.set(false); this.load(); }
      });
    }
  }

  setDone(t: Todo, checked: boolean) {
    this.api.update(t.id, { done: !!checked }).subscribe({ next: () => this.load() });
  }

  askRemove(t: Todo) {
    this.confirmTarget.set(t);
    this.confirmOpen.set(true);
  }

  cancelRemove() {
    this.confirmOpen.set(false);
    this.confirmTarget.set(null);
  }

  confirmRemove() {
    const t = this.confirmTarget();
    if (!t) return;
    this.api.remove(t.id).subscribe({
      next: () => {
        this.confirmOpen.set(false);
        this.confirmTarget.set(null);
        this.load();
      },
      error: (err) => {
        console.error('Erro ao excluir', err);
        this.confirmOpen.set(false);
        this.confirmTarget.set(null);
      }
    });
  }
}
