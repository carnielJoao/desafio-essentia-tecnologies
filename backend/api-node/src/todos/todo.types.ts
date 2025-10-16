export type Todo = {
    id: number;
    title: string;
    description?: string;
    done: boolean;
    createdAt: string;
    updatedAt: string;
  };
  
  export type CreateTodoDto = { title: string; description?: string };
  export type UpdateTodoDto = { title?: string; description?: string; done?: boolean };
  
  export type Page<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  
  export interface TodoAuditDoc {
    event: string;
    todo_id: number;
    user_id: number;
    actor_id: number;
    at?: Date;
    before?: any;
    after?: any;
    changed_fields?: string[];
  }
  