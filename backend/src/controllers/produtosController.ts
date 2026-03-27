import { Request, Response } from 'express';
import pool from '../config/db';
import path from 'path';
import fs   from 'fs';

export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM produtos WHERE ativo = 1 ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
}

export async function listarAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM produtos ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const { nome, descricao, ordem } = req.body;
    const arquivo = (req as any).file
      ? '/uploads/' + (req as any).file.filename
      : '';
    if (!nome || !arquivo) {
      res.status(400).json({ erro: 'Nome e foto são obrigatórios' });
      return;
    }
    await pool.query(
      'INSERT INTO produtos (nome, descricao, arquivo, ordem) VALUES (?,?,?,?)',
      [nome, descricao || '', arquivo, ordem || 0]
    );
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const { nome, descricao, ordem, ativo } = req.body;
    const arquivo = (req as any).file
      ? '/uploads/' + (req as any).file.filename
      : null;
    if (arquivo) {
      await pool.query(
        'UPDATE produtos SET nome=?, descricao=?, ordem=?, ativo=?, arquivo=? WHERE id=?',
        [nome, descricao, ordem, ativo, arquivo, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE produtos SET nome=?, descricao=?, ordem=?, ativo=? WHERE id=?',
        [nome, descricao, ordem, ativo, req.params.id]
      );
    }
    res.json({ mensagem: 'Produto atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
}

export async function remover(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM produtos WHERE id = ?', [req.params.id]
    );
    if (rows[0]?.arquivo) {
      const filepath = path.join(__dirname, '../../', rows[0].arquivo);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Produto removido' });
  } catch {
    res.status(500).json({ erro: 'Erro ao remover produto' });
  }
}