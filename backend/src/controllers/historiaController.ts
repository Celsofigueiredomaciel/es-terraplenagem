import { Request, Response } from 'express';
import pool from '../config/db';
import path  from 'path';
import fs    from 'fs';

// GET /api/historia  — público
export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM historia_slides WHERE ativo = 1 ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar slides' });
  }
}

// GET /api/historia/admin  — privado (todos, inclusive inativos)
export async function listarAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM historia_slides ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar slides' });
  }
}

// POST /api/historia  — cria slide com upload de foto
export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const { titulo, texto, ordem } = req.body;
    const arquivo = (req as any).file
      ? '/uploads/' + (req as any).file.filename
      : '';

    if (!titulo || !arquivo) {
      res.status(400).json({ erro: 'Título e foto são obrigatórios' });
      return;
    }

    await pool.query(
      'INSERT INTO historia_slides (titulo, texto, arquivo, ordem) VALUES (?,?,?,?)',
      [titulo, texto || '', arquivo, ordem || 0]
    );
    res.status(201).json({ mensagem: 'Slide criado com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao criar slide' });
  }
}

// PUT /api/historia/:id  — edita título, texto, ordem e ativo
export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const { titulo, texto, ordem, ativo } = req.body;
    const arquivo = (req as any).file
      ? '/uploads/' + (req as any).file.filename
      : null;

    if (arquivo) {
      await pool.query(
        'UPDATE historia_slides SET titulo=?, texto=?, ordem=?, ativo=?, arquivo=? WHERE id=?',
        [titulo, texto, ordem, ativo, arquivo, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE historia_slides SET titulo=?, texto=?, ordem=?, ativo=? WHERE id=?',
        [titulo, texto, ordem, ativo, req.params.id]
      );
    }
    res.json({ mensagem: 'Slide atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar slide' });
  }
}

// DELETE /api/historia/:id
export async function remover(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM historia_slides WHERE id = ?', [req.params.id]
    );
    if (rows[0]?.arquivo) {
      const filepath = path.join(__dirname, '../../', rows[0].arquivo);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    await pool.query('DELETE FROM historia_slides WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Slide removido' });
  } catch {
    res.status(500).json({ erro: 'Erro ao remover slide' });
  }
}