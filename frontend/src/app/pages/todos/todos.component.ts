import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodosService, Todo, Paginated } from '../../services/todos.service';
import { ToastrService } from 'ngx-toastr';
import { AuditService, TodoEvent } from '../../services/audit.service';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-semibold">Tarefas</h1>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" (click)="openCreate()">
        Criar
      </button>
    </div>

    <!-- Barra de busca + toggle -->
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1">
        <input class="w-full h-10 rounded-lg border px-3" type="text"
               placeholder="Pesquisar..."
               [(ngModel)]="searchText"
               (ngModelChange)="debouncedSearch()"/>
      </div>

      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" [checked]="!showDone()" (change)="togglePending($event)" />
        Pendentes
      </label>
    </div>

    <!-- Lista em cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div *ngFor="let t of items()" class="border rounded-xl p-4 relative">
        <div class="absolute right-3 top-3">
          <input type="checkbox"
                 [checked]="t.done"
                 (change)="onToggleDone($event, t)"/>
        </div>

        <div class="font-medium mb-1 break-words">{{ t.title }}</div>
        <div class="text-sm text-gray-500 whitespace-pre-line break-words">{{ t.description || '' }}</div>

        <div class="flex gap-2 mt-3">
          <button class="px-3 py-1 rounded border" (click)="openEdit(t)">Editar</button>
          <button class="px-3 py-1 rounded border text-red-600 border-red-300" (click)="confirmDelete(t)">Excluir</button>
          <button class="px-3 py-1 rounded border" (click)="openAudit(t)">Histórico</button>
        </div>
      </div>
    </div>

    <!-- Paginação -->
    <div class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-500">
        Página {{ page() }} de {{ lastPage() }} — {{ total() }} itens
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-1 rounded border" [disabled]="page()<=1" (click)="go(page()-1)">Anterior</button>
        <button class="px-3 py-1 rounded border" [disabled]="page()>=lastPage()" (click)="go(page()+1)">Próxima</button>
      </div>
    </div>

    <!-- Modal Criar/Editar -->
    <div *ngIf="modalOpen()" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-md rounded-xl shadow-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">{{ editing() ? 'Editar tarefa' : 'Criar tarefa' }}</h2>
          <button (click)="close()" class="p-2 rounded hover:bg-gray-100" aria-label="Fechar">✕</button>
        </div>

        <form (ngSubmit)="save()" class="space-y-3">
          <div>
            <label class="text-sm font-medium">Título</label>
            <input class="w-full h-10 rounded-lg border px-3"
                   name="title" required [(ngModel)]="form.title"/>
          </div>
          <div>
            <label class="text-sm font-medium">Descrição (opcional)</label>
            <textarea class="w-full rounded-lg border px-3 py-2"
                      rows="3" name="description"
                      [(ngModel)]="form.description"></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="px-3 py-1 rounded border" (click)="close()">Cancelar</button>
            <button type="submit" class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
              {{ editing() ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmar Exclusão -->
    <div *ngIf="confirmOpen()" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-md rounded-xl shadow-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Confirmar exclusão</h2>
          <button (click)="closeConfirm()" class="p-2 rounded hover:bg-gray-100" aria-label="Fechar">✕</button>
        </div>
        <p class="text-sm">Tem certeza que deseja excluir a tarefa <b>{{ toDelete?.title }}</b>?</p>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-3 py-1 rounded border" (click)="closeConfirm()">Cancelar</button>
          <button class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" (click)="doDelete()">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Modal Histórico -->
    <div *ngIf="auditOpen()" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-xl rounded-xl shadow-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Histórico — {{ auditFor?.title }}</h2>
          <button (click)="closeAudit()" class="p-2 rounded hover:bg-gray-100" aria-label="Fechar">✕</button>
        </div>

        <div *ngIf="auditLoading()" class="text-sm text-gray-500">Carregando…</div>
        <div *ngIf="!auditLoading() && auditItems().length===0" class="text-sm text-gray-500">
          Sem eventos para esta tarefa.
        </div>

        <ul *ngIf="!auditLoading() && auditItems().length>0" class="space-y-3 max-h-80 overflow-y-auto">
          <li *ngFor="let e of auditItems()" class="border rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium px-2 py-1 rounded"
                    [ngClass]="{
                      'bg-green-100 text-green-800': e.type==='created',
                      'bg-yellow-100 text-yellow-800': e.type==='updated',
                      'bg-red-100 text-red-800': e.type==='deleted'
                    }">
                {{ getEventLabel(e.type) }}
              </span>
              <span class="text-xs text-gray-500">{{ e.at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            
            <div class="text-sm space-y-2">
              <!-- Mudanças no título -->
              <div *ngIf="e.details?.changed_fields?.includes('title')" class="bg-blue-50 p-2 rounded">
                <div class="font-medium text-blue-800">Título alterado:</div>
                <div class="text-xs text-gray-600">
                  <span class="line-through">{{ e.details.before?.title }}</span> 
                  → 
                  <span class="font-medium">{{ e.details.after?.title }}</span>
                </div>
              </div>
              
              <!-- Mudanças na descrição -->
              <div *ngIf="e.details?.changed_fields?.includes('description')" class="bg-purple-50 p-2 rounded">
                <div class="font-medium text-purple-800">Descrição alterada:</div>
                <div class="text-xs text-gray-600">
                  <div *ngIf="e.details.before?.description" class="line-through">{{ e.details.before.description }}</div>
                  <div *ngIf="!e.details.before?.description" class="text-gray-400 italic">(vazio)</div>
                  <div class="font-medium">{{ e.details.after?.description || '(vazio)' }}</div>
                </div>
              </div>
              
              <!-- Mudanças no status -->
              <div *ngIf="e.details?.changed_fields?.includes('done')" class="bg-orange-50 p-2 rounded">
                <div class="font-medium text-orange-800">Status alterado:</div>
                <div class="text-xs text-gray-600">
                  <span [ngClass]="e.details.before?.done ? 'text-green-600' : 'text-gray-500'">
                    {{ e.details.before?.done ? 'Concluída' : 'Pendente' }}
                  </span>
                  → 
                  <span [ngClass]="e.details.after?.done ? 'text-green-600' : 'text-gray-500'">
                    {{ e.details.after?.done ? 'Concluída' : 'Pendente' }}
                  </span>
                </div>
              </div>
              
              <!-- Criação de tarefa -->
              <div *ngIf="e.type === 'created'" class="bg-green-50 p-2 rounded">
                <div class="font-medium text-green-800">Tarefa criada:</div>
                <div class="text-xs text-gray-600">
                  <div><strong>Título:</strong> {{ e.details.after?.title }}</div>
                  <div *ngIf="e.details.after?.description"><strong>Descrição:</strong> {{ e.details.after.description }}</div>
                  <div><strong>Status:</strong> {{ e.details.after?.done ? 'Concluída' : 'Pendente' }}</div>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div class="mt-4 text-right">
          <button (click)="closeAudit()" class="px-3 py-1 rounded border">Fechar</button>
        </div>
      </div>
    </div>
  </div>
  `,
})
export default class TodosComponent {
  private api = inject(TodosService);
  private toast = inject(ToastrService);
  private audit = inject(AuditService);

  page = signal(1);
  perPage = signal(12);
  lastPage = signal(1);
  total = signal(0);
  searchText = '';
  showDone = signal(false);

  items = signal<Todo[]>([]);
  modalOpen = signal(false);
  editing = signal(false);
  form: Partial<Todo> = { title: '', description: '' };
  editingId: number | string | null = null;

  confirmOpen = signal(false);
  toDelete: Todo | null = null;

  auditOpen = signal(false);
  auditLoading = signal(false);
  auditItems = signal<TodoEvent[]>([]);
  auditFor: { id: number | string; title: string } | null = null;

  constructor() {
    effect(() => void this.load());
  }

  async load() {
    this.api.list({
      page: this.page(),
      per_page: this.perPage(),
      search: this.searchText?.trim() || undefined,
      done: this.showDone(),
    }).subscribe({
      next: (res: Paginated<Todo>) => {
        this.items.set(res.data || []);
        this.page.set(res.current_page || 1);
        this.lastPage.set(res.last_page || 1);
        this.total.set(res.total || 0);
      },
      error: () => this.toast.error('Falha ao carregar tarefas.'),
    });
  }

  go(p: number) {
    if (p < 1 || p > this.lastPage()) return;
    this.page.set(p);
  }

  debouncedSearch: () => void = (() => {
    let t: any;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => { this.page.set(1); this.load(); }, 350);
    };
  })();

  togglePending(ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    this.showDone.set(!checked);
    this.page.set(1);
    void this.load();
  }

  openCreate() {
    this.editing.set(false);
    this.editingId = null;
    this.form = { title: '', description: '' };
    this.modalOpen.set(true);
  }

  openEdit(t: Todo) {
    this.editing.set(true);
    this.editingId = t.id;
    this.form = { title: t.title, description: t.description ?? '' };
    this.modalOpen.set(true);
  }

  close() { this.modalOpen.set(false); }

  save() {
    const payload = { title: (this.form.title || '').trim(), description: (this.form.description || '').trim() || null };
    if (!payload.title) { this.toast.warning('Título é obrigatório.'); return; }

    if (this.editing() && this.editingId != null) {
      this.api.update(this.editingId, payload).subscribe({
        next: () => { this.toast.success('Tarefa atualizada.'); this.modalOpen.set(false); this.load(); },
        error: () => this.toast.error('Falha ao atualizar.'),
      });
    } else {
      this.api.create(payload).subscribe({
        next: () => { this.toast.success('Tarefa criada.'); this.modalOpen.set(false); this.page.set(1); this.load(); },
        error: () => this.toast.error('Falha ao criar.'),
      });
    }
  }

  onToggleDone(event: Event, t: Todo) {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update(t.id, { done: checked }).subscribe({
      next: () => { this.toast.info(checked ? 'Concluída.' : 'Marcada como pendente.'); this.load(); },
      error: () => this.toast.error('Falha ao alterar status.'),
    });
  }

  confirmDelete(t: Todo) { this.toDelete = t; this.confirmOpen.set(true); }
  closeConfirm() { this.confirmOpen.set(false); this.toDelete = null; }

  doDelete() {
    if (!this.toDelete) return;
    this.api.remove(this.toDelete.id).subscribe({
      next: () => { this.toast.success('Excluída.'); this.closeConfirm(); this.load(); },
      error: () => this.toast.error('Falha ao excluir.'),
    });
  }

  openAudit(t: Todo) {
    this.auditFor = { id: t.id, title: t.title };
    this.auditOpen.set(true);
    this.auditLoading.set(true);
    this.audit.list(t.id).subscribe({
      next: evts => { this.auditItems.set(evts); this.auditLoading.set(false); },
      error: () => { this.auditItems.set([]); this.auditLoading.set(false); this.toast.error('Falha ao carregar histórico.'); }
    });
  }

  closeAudit() {
    this.auditOpen.set(false);
    this.auditItems.set([]);
    this.auditFor = null;
  }

  getEventLabel(type: string): string {
    switch (type) {
      case 'created':
        return 'Criada';
      case 'updated':
        return 'Atualizada';
      case 'deleted':
        return 'Excluída';
      default:
        return type;
    }
  }
}
