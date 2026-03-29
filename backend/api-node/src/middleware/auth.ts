import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; email?: string; name?: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });

  const [scheme, token] = header.split(' ');
  if ((scheme || '').toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Invalid Authorization format' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: 'JWT secret not configured' });

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    const sub = decoded?.sub as unknown;
    let id: number | undefined;

    if (typeof sub === 'number') {
      id = sub;
    } else if (typeof sub === 'string' && sub.trim() !== '' && !Number.isNaN(Number(sub))) {
      id = Number(sub);
    }

    if (typeof id !== 'number') {
      return res.status(401).json({ message: 'Token missing subject (sub)' });
    }

    req.user = {
      id,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      name: typeof decoded.name === 'string' ? decoded.name : undefined,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
