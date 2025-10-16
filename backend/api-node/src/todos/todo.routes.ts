import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logTodoEvent, listTodoEvents } from '../audit/audit.service';
import { diffTodo } from '../audit/diff';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const todoRouter = Router();


// CREATE
todoRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body ?? {};
  if (!title || typeof title !== 'string') {
    return res.status(422).json({ message: 'Título é obrigatório.' });
  }
  const userId = req.user!.id;      // do JWT (middleware)
  const t = await prisma.todos.create({
    data: { title: title.trim(), description: description?.trim() || null, user_id: userId },
  });

  await logTodoEvent({
    event: 'todo.created',
    todo_id: Number(t.id),
    user_id: Number(t.user_id),
    actor_id: userId,
    at: new Date(),
    after: { title: t.title, description: t.description, done: t.done },
    changed_fields: ['title','description','done'],
  });

  res.status(201).json(t);
});

// TEST ROUTE
todoRouter.get('/test', async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Test route working' });
});

// AUDIT - Histórico por TODO
todoRouter.get('/:id/audit', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
  const page = parseInt(String(req.query.page ?? 1), 10) || 1;
    const per = parseInt(String(req.query.per_page ?? 20), 10) || 20;

    console.log(`[AUDIT] Requesting audit for todo ${id}, page ${page}, per ${per}`);
    
    const out = await listTodoEvents(id, page, per);
    console.log(`[AUDIT] Found ${out.data.length} events`);
    
    res.json(out);
  } catch (error) {
    console.error('[AUDIT] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// LIST
todoRouter.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(String(req.query.page ?? 1), 10) || 1;
  const per_page = parseInt(String(req.query.per_page ?? 20), 10) || 20;
  const search = String(req.query.search ?? '').trim();
  const done = req.query.done !== undefined ? req.query.done === 'true' : undefined;

  const where: any = { user_id: userId };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } }
    ];
  }
  if (done !== undefined) {
    where.done = done;
  }

  const [todos, total] = await Promise.all([
    prisma.todos.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
    prisma.todos.count({ where })
  ]);

  res.json({
    data: todos,
    current_page: page,
    last_page: Math.ceil(total / per_page),
    total,
    per_page
  });
});

// UPDATE
todoRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;

  const before = await prisma.todos.findFirst({ where: { id, user_id: userId }});
  if (!before) return res.status(404).json({ message: 'Tarefa não encontrada.' });

  const { title, description, done } = req.body ?? {};
  const updated = await prisma.todos.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: String(title) } : {}),
      ...(description !== undefined ? { description: (description===''? null : String(description)) } : {}),
      ...(done !== undefined ? { done: !!done } : {}),
    },
  });

  const d = diffTodo(
    { title: before.title, description: before.description, done: before.done },
    { title: updated.title, description: updated.description, done: updated.done }
  );

  await logTodoEvent({
    event: (done === true) ? 'todo.done_on' :
           (done === false) ? 'todo.done_off' : 'todo.updated',
    todo_id: Number(updated.id),
    user_id: Number(updated.user_id),
    actor_id: userId,
    at: new Date(),
    before: { title: before.title, description: before.description, done: before.done },
    after:  { title: updated.title, description: updated.description, done: updated.done },
    changed_fields: d.changed_fields,
  });

  res.json(updated);
});

// DELETE
todoRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;

  const before = await prisma.todos.findFirst({ where: { id, user_id: userId }});
  if (!before) return res.status(404).json({ message: 'Tarefa não encontrada.' });

  await prisma.todos.delete({ where: { id } });

  await logTodoEvent({
    event: 'todo.deleted',
    todo_id: id,
    user_id: Number(before.user_id),
    actor_id: userId,
    at: new Date(),
    before: { title: before.title, description: before.description, done: before.done },
    changed_fields: ['title','description','done'],
  });

  res.json({ deleted: true });
});
