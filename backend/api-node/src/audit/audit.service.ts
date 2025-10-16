import { getDb } from '../mongo/mongo.client';
import { TodoAuditDoc, TodoAuditEvent } from './audit.types';

export async function logTodoEvent(doc: TodoAuditDoc) {
  const db = getDb();
  await db.collection<TodoAuditDoc>('todo_audits').insertOne({
    ...doc,
    at: doc.at ?? new Date(),
  });
}

export async function listTodoEvents(todoId: number, page = 1, perPage = 20) {
  const db = getDb();
  const skip = (Math.max(1, page) - 1) * Math.max(1, perPage);
  const [total, data] = await Promise.all([
    db.collection<TodoAuditDoc>('todo_audits').countDocuments({ todo_id: todoId }),
    db.collection<TodoAuditDoc>('todo_audits')
      .find({ todo_id: todoId })
      .sort({ at: -1 })
      .skip(skip)
      .limit(perPage)
      .toArray(),
  ]);
  return {
    data,
    current_page: Math.max(1, page),
    per_page: Math.max(1, perPage),
    last_page: Math.max(1, Math.ceil(total / Math.max(1, perPage))),
    total,
  };
}
