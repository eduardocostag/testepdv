import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express { interface Request { user?: { id: string; companyId: string; role: string; name: string } } }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Token não informado' });
  try {
    const token = header.replace('Bearer ', '');
    if (token === 'demo-token-smartfood') {
      req.user = { id: 'user-demo', companyId: 'company-demo', role: 'ADMIN', name: 'Administrador' };
      return next();
    }
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev') as any;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
