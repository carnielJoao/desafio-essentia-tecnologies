export type TodoAuditEvent =
  | 'todo.created'
  | 'todo.updated'
  | 'todo.deleted'
  | 'todo.done_on'
  | 'todo.done_off';

export interface TodoAuditDoc {
  _id?: any;
  event: TodoAuditEvent;
  todo_id: number;           // id do MySQL (inteiro)
  user_id: number;           // dono do registro (MySQL)
  actor_id: number;          // quem realizou a ação (JWT)
  at: Date;
  // difs opcionais
  before?: Partial<{ title: string; description: string | null; done: boolean }>;
  after?:  Partial<{ title: string; description: string | null; done: boolean }>;
  changed_fields?: string[];
  meta?: Record<string, any>;
}
