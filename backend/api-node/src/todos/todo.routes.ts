// src/todos/todo.routes.ts
import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
export const todoRouter = Router();

todoRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req.user as any)?.id);
    if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Usuário inválido no token.' });

    const q = String(req.query.search ?? '').trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
    const per  = Math.max(1, Math.min(50, parseInt(String(req.query.per_page ?? 12), 10)));
    const doneParam = String(req.query.done ?? '').toLowerCase();
    const doneFilter = doneParam === 'true' ? true : doneParam === 'false' ? false : undefined;

    const where: any = { user_id: userId };
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    if (doneFilter !== undefined) where.done = doneFilter;

    const [total, data] = await Promise.all([
      prisma.todos.count({ where }),
      prisma.todos.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * per,
        take: per,
      }),
    ]);

    res.json({ data, current_page: page, last_page: Math.max(1, Math.ceil(total / per)), total, per_page: per });
  } catch (err) { next(err); }
});

todoRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req.user as any)?.id);
    if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Usuário inválido no token.' });

    const { title, description } = req.body ?? {};
    if (!title || typeof title !== 'string') return res.status(422).json({ message: 'Título é obrigatório.' });

    const t = await prisma.todos.create({
      data: { user_id: userId, title: title.trim(), description: description?.trim() || null },
    });
    res.status(201).json(t);
  } catch (err) { next(err); }
});

todoRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req.user as any)?.id);
    if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Usuário inválido no token.' });

    const id = Number(req.params.id);
    const { title, description, done } = req.body ?? {};

    const exists = await prisma.todos.findFirst({ where: { id, user_id: userId } });
    if (!exists) return res.status(404).json({ message: 'Tarefa não encontrada.' });

    const t = await prisma.todos.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(description !== undefined ? { description: String(description) } : {}),
        ...(done !== undefined ? { done: !!done } : {}),
        updated_at: new Date(),
      },
    });
    res.json(t);
  } catch (err) { next(err); }
});

todoRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req.user as any)?.id);
    if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Usuário inválido no token.' });

    const id = Number(req.params.id);
    const exists = await prisma.todos.findFirst({ where: { id, user_id: userId } });
    if (!exists) return res.status(404).json({ message: 'Tarefa não encontrada.' });

    await prisma.todos.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});
