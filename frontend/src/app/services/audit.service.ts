import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export type AuditType = 'created' | 'updated' | 'deleted';

export interface TodoEvent {
  type: AuditType;
  todo_id: number | string;
  actor_id?: number | string | null;
  actor_email?: string | null;
  at: string;               // ISO string
  details?: any;            // payload livre (parciais, diffs, etc.)
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private base = 'http://127.0.0.1:3001'; // mesmo host do Node API

  list(todoId: number | string) {
    return this.http.get<any>(`${this.base}/api/todos/${todoId}/audit`).pipe(
      map(response => {
        // Converte os dados da API para o formato esperado pelo componente
        return response.data.map((event: any) => ({
          type: this.mapEventType(event.event),
          todo_id: event.todo_id,
          actor_id: event.actor_id,
          actor_email: null, // Não temos email do usuário na API
          at: event.at,
          details: {
            before: event.before,
            after: event.after,
            changed_fields: event.changed_fields
          }
        }));
      })
    );
  }

  private mapEventType(event: string): AuditType {
    switch (event) {
      case 'todo.created':
        return 'created';
      case 'todo.updated':
      case 'todo.done_on':
      case 'todo.done_off':
        return 'updated';
      case 'todo.deleted':
        return 'deleted';
      default:
        return 'updated';
    }
  }
}
