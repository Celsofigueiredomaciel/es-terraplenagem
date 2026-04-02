import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ── Listar usuários (admin) ───────────────────────────
export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT id, nome, email, role, permissoes, ativo, criado_em, ultimo_login, criado_por
       FROM usuarios ORDER BY criado_em ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
}

// ── Criar usuário (admin) ─────────────────────────────
export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { nome, email, senha, role, permissoes } = req.body;

  if (!nome?.trim() || !email?.trim() || !senha || !role) {
    res.status(400).json({ erro: 'Nome, email, senha e role são obrigatórios' });
    return;
  }
  if (senha.length < 8) {
    res.status(400).json({ erro: 'Senha deve ter ao menos 8 caracteres' });
    return;
  }
  if (!['admin', 'secretaria'].includes(role)) {
    res.status(400).json({ erro: 'Role inválido. Use: admin ou secretaria' });
    return;
  }

  try {
    const hash = await bcrypt.hash(senha, 10);
    const perms = permissoes ? JSON.stringify(permissoes) : JSON.stringify([]);
    const [result]: any = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, permissoes, ativo, criado_por)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [nome.trim(), email.trim().toLowerCase(), hash, role, perms, req.usuario?.id]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Usuário criado com sucesso' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ erro: 'Já existe um usuário com este e-mail' });
    } else {
      res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
  }
}

// ── Atualizar usuário (admin) ─────────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { nome, email, role, permissoes } = req.body;
  const id = Number(req.params.id);

  if (!nome?.trim() || !email?.trim() || !role) {
    res.status(400).json({ erro: 'Nome, email e role são obrigatórios' });
    return;
  }

  try {
    // ✅ Impede alteração do admin principal (id=1)
    const [rows]: any = await pool.query(
      'SELECT id, role FROM usuarios WHERE id = ?', [id]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
      return;
    }
    if (rows[0].id === 1 && req.usuario?.id !== 1) {
      res.status(403).json({ erro: 'Não é permitido alterar o administrador principal' });
      return;
    }

    const perms = permissoes ? JSON.stringify(permissoes) : JSON.stringify([]);
    await pool.query(
      'UPDATE usuarios SET nome=?, email=?, role=?, permissoes=? WHERE id=?',
      [nome.trim(), email.trim().toLowerCase(), role, perms, id]
    );
    res.json({ mensagem: 'Usuário atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
}

// ── Ativar / Inativar usuário (admin) ─────────────────
export async function alterarStatus(req: AuthRequest, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { ativo } = req.body;

  // ✅ Admin principal nunca pode ser inativado
  if (id === 1) {
    res.status(403).json({ erro: 'O administrador principal não pode ser inativado' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE usuarios SET ativo = ? WHERE id = ?',
      [ativo ? 1 : 0, id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
      return;
    }
    res.json({ mensagem: ativo ? 'Usuário ativado' : 'Usuário inativado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao alterar status' });
  }
}

// ── Resetar senha (admin) ─────────────────────────────
export async function resetarSenha(req: AuthRequest, res: Response): Promise<void> {
  const { novaSenha } = req.body;
  const id = Number(req.params.id);

  if (!novaSenha || novaSenha.length < 8) {
    res.status(400).json({ erro: 'Senha deve ter ao menos 8 caracteres' });
    return;
  }

  try {
    const hash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      'UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, id]
    );
    res.json({ mensagem: 'Senha resetada com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao resetar senha' });
  }
}
