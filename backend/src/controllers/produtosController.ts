import { Request, Response } from 'express';
import pool from '../config/db';
import path from 'path';
import fs   from 'fs';
import { AuthRequest } from '../middleware/auth';

// ── Listar produtos (pública) ─────────────────────────
export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      // ✅ Colunas explícitas — sem SELECT *
      `SELECT id, nome, descricao, arquivo, ordem
       FROM produtos WHERE ativo = 1 ORDER BY ordem ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
}

// ── Listar todos (admin) ──────────────────────────────
export async function listarAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      // ✅ Colunas explícitas — sem SELECT *
      `SELECT id, nome, descricao, arquivo, ordem, ativo
       FROM produtos ORDER BY ordem ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
}

// ── Criar produto (admin) ─────────────────────────────
export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { nome, descricao, ordem } = req.body;
  const arquivo = req.file ? `/uploads/${req.file.filename}` : null; // ✅ AuthRequest

  if (!nome?.trim() || !arquivo) {
    res.status(400).json({ erro: 'Nome e foto são obrigatórios' });
    return;
  }

  // ✅ Validação de tamanho
  if (nome.trim().length > 150) {
    res.status(400).json({ erro: 'Nome muito longo — máximo 150 caracteres' });
    return;
  }

  try {
    await pool.query(
      'INSERT INTO produtos (nome, descricao, arquivo, ordem) VALUES (?,?,?,?)',
      [
        nome.trim(),
        descricao?.trim() || null,
        arquivo,
        Number(ordem) || 0
      ]
    );
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
}

// ── Atualizar produto (admin) ─────────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { nome, descricao, ordem, ativo } = req.body;

  if (!nome?.trim()) {
    res.status(400).json({ erro: 'Nome é obrigatório' });
    return;
  }

  // ✅ Valida ativo — aceita apenas 0 ou 1
  const ativoVal = ativo === true || ativo === 1 || ativo === '1' ? 1 : 0;
  const arquivo  = req.file ? `/uploads/${req.file.filename}` : null; // ✅ AuthRequest

  try {
    if (arquivo) {
      await pool.query(
        'UPDATE produtos SET nome=?, descricao=?, ordem=?, ativo=?, arquivo=? WHERE id=?',
        [nome.trim(), descricao?.trim() || null, Number(ordem) || 0, ativoVal, arquivo, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE produtos SET nome=?, descricao=?, ordem=?, ativo=? WHERE id=?',
        [nome.trim(), descricao?.trim() || null, Number(ordem) || 0, ativoVal, req.params.id]
      );
    }
    res.json({ mensagem: 'Produto atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
}

// ── Remover produto (admin) ───────────────────────────
export async function remover(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM produtos WHERE id = ?', [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Produto não encontrado' });
      return;
    }
    if (rows[0]?.arquivo) {
      // ✅ path.basename previne path traversal
      const filepath = path.join(__dirname, '../../uploads', path.basename(rows[0].arquivo));
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Produto removido' });
  } catch {
    res.status(500).json({ erro: 'Erro ao remover produto' });
  }
}