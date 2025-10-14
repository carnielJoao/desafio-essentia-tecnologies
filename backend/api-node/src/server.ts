import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authMiddleware, AuthRequest } from './middleware/auth';
import { todoRouter } from './todos/todo.routes';

const app = express();
const port = Number(process.env.PORT || 3001);
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200,http://127.0.0.1:4200')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);


app.set('etag', false);
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cors({
  origin: corsOrigins,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(morgan('dev'));
app.use((req, _res, next) => { console.log('Origin:', req.headers.origin); next(); });

app.use(express.json());

app.use((_req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body: any) =>
    _json(JSON.parse(JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))));
  next();
});

// pública
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// protegida
app.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// TODOS
app.use('/api/todos', authMiddleware, todoRouter);

app.listen(port, () => {
  console.log(`Node API (TS) on http://127.0.0.1:${port}`);
});
