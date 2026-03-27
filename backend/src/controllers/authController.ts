import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ erro: 'Email e senha obrigatórios' });
    return;
  }
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]
    );
    const usuario = rows[0];
    if (!usuario) {
      res.status(401).json({ erro: 'Credenciais inválidas' });
      return;
    }
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      res.status(401).json({ erro: 'Credenciais inválidas' });
      return;
    }
    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [usuario.id]
    );
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    });
  } catch (err) {
    console.error('ERRO LOGIN:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
}

export async function trocarSenha(req: AuthRequest, res: Response): Promise<void> {
  const { senhaAtual, novaSenha } = req.body;
  try {
    const [rows]: any = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = ?', [req.usuario?.id]
    );
    const ok = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
    if (!ok) {
      res.status(400).json({ erro: 'Senha atual incorreta' });
      return;
    }
    const hash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      'UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, req.usuario?.id]
    );
    res.json({ mensagem: 'Senha atualizada com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

export async function perfil(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, nome, email, role, criado_em, ultimo_login FROM usuarios WHERE id = ?',
      [req.usuario?.id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}