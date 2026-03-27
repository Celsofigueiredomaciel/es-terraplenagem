import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuario?: { id: number; email: string; role: string };
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ erro: 'Token não fornecido' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthRequest['usuario'];
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function apenasAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.usuario?.role !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito ao administrador' });
    return;
  }
  next();
}