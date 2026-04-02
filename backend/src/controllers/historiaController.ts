import { Request, Response } from 'express';
import pool from '../config/db';
import path  from 'path';
import fs    from 'fs';
import { AuthRequest } from '../middleware/auth';

// ── Listar slides (pública) ───────────────────────────
export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      // ✅ Colunas explícitas — sem SELECT *
      `SELECT id, titulo, texto, arquivo, ordem
       FROM historia_slides WHERE ativo = 1 ORDER BY ordem ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar slides' });
  }
}

// ── Listar todos (admin) ──────────────────────────────
export async function listarAdmin(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      // ✅ Colunas explícitas — sem SELECT *
      `SELECT id, titulo, texto, arquivo, ordem, ativo
       FROM historia_slides ORDER BY ordem ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar slides' });
  }
}

// ── Criar slide (admin) ───────────────────────────────
export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, texto, ordem } = req.body;
  const arquivo = req.file ? `/uploads/${req.file.filename}` : null; // ✅ AuthRequest

  if (!titulo?.trim() || !arquivo) {
    res.status(400).json({ erro: 'Título e foto são obrigatórios' });
    return;
  }

  // ✅ Validação de tamanho
  if (titulo.trim().length > 150) {
    res.status(400).json({ erro: 'Título muito longo — máximo 150 caracteres' });
    return;
  }
  if (texto && texto.length > 1000) {
    res.status(400).json({ erro: 'Texto muito longo — máximo 1000 caracteres' });
    return;
  }

  try {
    await pool.query(
      'INSERT INTO historia_slides (titulo, texto, arquivo, ordem) VALUES (?,?,?,?)',
      [titulo.trim(), texto?.trim() || null, arquivo, Number(ordem) || 0]
    );
    res.status(201).json({ mensagem: 'Slide criado com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao criar slide' });
  }
}

// ── Atualizar slide (admin) ───────────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, texto, ordem, ativo } = req.body;

  if (!titulo?.trim()) {
    res.status(400).json({ erro: 'Título é obrigatório' });
    return;
  }
  if (titulo.trim().length > 150) {
    res.status(400).json({ erro: 'Título muito longo — máximo 150 caracteres' });
    return;
  }

  // ✅ Normaliza ativo para 0 ou 1
  const ativoVal = ativo === true || ativo === 1 || ativo === '1' ? 1 : 0;
  const arquivo  = req.file ? `/uploads/${req.file.filename}` : null; // ✅ AuthRequest

  try {
    if (arquivo) {
      await pool.query(
        'UPDATE historia_slides SET titulo=?, texto=?, ordem=?, ativo=?, arquivo=? WHERE id=?',
        [titulo.trim(), texto?.trim() || null, Number(ordem) || 0, ativoVal, arquivo, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE historia_slides SET titulo=?, texto=?, ordem=?, ativo=? WHERE id=?',
        [titulo.trim(), texto?.trim() || null, Number(ordem) || 0, ativoVal, req.params.id]
      );
    }
    res.json({ mensagem: 'Slide atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar slide' });
  }
}

// ── Remover slide (admin) ─────────────────────────────
export async function remover(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM historia_slides WHERE id = ?', [req.params.id]
    );
    // ✅ Verifica se o slide existe
    if (!rows[0]) {
      res.status(404).json({ erro: 'Slide não encontrado' });
      return;
    }
    if (rows[0]?.arquivo) {
      // ✅ path.basename previne path traversal
      const filepath = path.join(__dirname, '../../uploads', path.basename(rows[0].arquivo));
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    await pool.query('DELETE FROM historia_slides WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Slide removido' });
  } catch {
    res.status(500).json({ erro: 'Erro ao remover slide' });
  }
}