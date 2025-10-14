import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
export const todoRouter = Router();

// LOG
function debugList(req: Request) {
  console.log('[LIST TODOS]', {
    rawPage: req.query.page,
    rawPer: req.query.per_page,
    rawSearch: req.query.search,
    rawDone: req.query.done,
  });
}

// GET /api/todos?search=&page=&per_page=&done=true|false
todoRouter.get('/', async (req: Request, res: Response) => {
  debugList(req);

  const q = String(req.query.search ?? '').trim();
  const page = Math.max(1, (Number(req.query.page ?? 1) || 1));
  const per  = Math.max(1, Math.min(50, (Number(req.query.per_page ?? 12) || 12)));

  const doneParam = String(req.query.done ?? '').toLowerCase();
  const doneFilter =
    doneParam === 'true' ? true :
    doneParam === 'false' ? false :
    undefined;

  const where: any = {};
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

todoRouter.post('/__seed', async (_req: Request, res: Response) => {
  await prisma.todos.createMany({
    data: [
      { title: 'Primeira tarefa', description: 'teste', done: false },
      { title: 'Segunda tarefa', description: null,     done: true  },
      { title: 'Mais uma',        description: 'ok',     done: false },
    ],
    skipDuplicates: true,
  });
  res.json({ ok: true });
});

// POST /api/todos
todoRouter.post('/', async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};
  if (!title || typeof title !== 'string') {
    return res.status(422).json({ message: 'Título é obrigatório.' });
  }
  const t = await prisma.todos.create({
    data: { title: title.trim(), description: description?.trim() || null },
  });
  res.status(201).json(t);
});

// PUT /api/todos/:id
todoRouter.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, done } = req.body ?? {};
  try {
    const t = await prisma.todos.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(description !== undefined ? { description: String(description) } : {}),
        ...(done !== undefined ? { done: !!done } : {}),
      },
    });
    res.json(t);
  } catch {
    res.status(404).json({ message: 'Tarefa não encontrada.' });
  }
});

// DELETE /api/todos/:id
todoRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.todos.delete({ where: { id } });
    res.json({ deleted: true });
  } catch {
    res.status(404).json({ message: 'Tarefa não encontrada.' });
  }
});
