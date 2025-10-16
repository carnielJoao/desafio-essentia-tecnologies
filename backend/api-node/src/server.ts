import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authMiddleware, AuthRequest } from './middleware/auth';
import { todoRouter } from './todos/todo.routes';

const app = express();
const port = Number(process.env.PORT || 3001);

const corsOrigins =
  (process.env.CORS_ORIGIN ||
    'http://localhost:8080,http://127.0.0.1:8080,http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// Cache off
app.set('etag', false);
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// CORS
const corsConfig: cors.CorsOptions = {
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

// Logs
app.use(morgan('dev'));
app.use((req, _res, next) => { console.log('Origin:', req.headers.origin); next(); });

// JSON + BigInt->number
app.use(express.json());
app.use((_req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body: any) =>
    _json(JSON.parse(JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))));
  next();
});

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Protegida de teste
app.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Todos
app.use('/api/todos', authMiddleware, todoRouter);

// *** middleware de erro (depois das rotas) ***
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(err?.status || 500).json({ message: err?.message || 'Internal Server Error' });
});

// *** IMPORTANTE: escutar em 0.0.0.0 para funcionar no container ***
app.listen(port, '0.0.0.0', () => {
  console.log(`Node API (TS) on http://0.0.0.0:${port}`);
});