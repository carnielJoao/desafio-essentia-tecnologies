import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const todoRouter = Router();

// Lista paginada e filtrável por search/done — SEMPRE do usuário logado
todoRouter.get('/', async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const rawPage = String(req.query.page ?? '1');
  const rawPer  = String(req.query.per_page ?? '12');
  const q       = String(req.query.search ?? '').trim();
  const doneParam = String(req.query.done ?? '').toLowerCase();

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const per  = Math.max(1, Math.min(50, parseInt(rawPer, 10) || 12));

  const doneFilter =
    doneParam === 'true' ? true :
    doneParam === 'false' ? false : undefined;

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

  res.json({
    data,
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / per)),
    total,
    per_page: per,
  });
});

// Criar — amarra ao usuário do token
todoRouter.post('/', async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const { title, description } = req.body ?? {};
  if (!title || typeof title !== 'string') {
    return res.status(422).json({ message: 'Título é obrigatório.' });
  }

  const t = await prisma.todos.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      user_id: userId,
    },
  });

  res.status(201).json(t);
});

// Atualizar — só do dono
todoRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const id = Number(req.params.id);
  const { title, description, done } = req.body ?? {};

  // garante ownership via where
  const updated = await prisma.todos.updateMany({
    where: { id, user_id: userId },
    data: {
      ...(title !== undefined ? { title: String(title) } : {}),
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(done !== undefined ? { done: !!done } : {}),
    },
  });

  if (updated.count === 0) {
    return res.status(404).json({ message: 'Tarefa não encontrada.' });
  }

  const t = await prisma.todos.findUnique({ where: { id } });
  res.json(t);
});

// Excluir — só do dono
todoRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const id = Number(req.params.id);

  const deleted = await prisma.todos.deleteMany({
    where: { id, user_id: userId },
  });

  if (deleted.count === 0) {
    return res.status(404).json({ message: 'Tarefa não encontrada.' });
  }

  res.json({ deleted: true });
});
