import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function listar(req: Request, res: Response): Promise<void> {
  const { categoria, tipo, destaque } = req.query;
  let sql = 'SELECT * FROM midias WHERE ativo = 1';
  const params: any[] = [];
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  if (tipo)      { sql += ' AND tipo = ?';      params.push(tipo); }
  if (destaque)  { sql += ' AND destaque = 1'; }
  sql += ' ORDER BY ordem ASC, criado_em DESC';
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar mídias' });
  }
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM midias WHERE id = ? AND ativo = 1', [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ erro: 'Mídia não encontrada' }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, descricao, tipo, categoria, destaque, ordem } = req.body;
  const arquivo = req.file ? `/uploads/${req.file.filename}` : null;
  if (!arquivo) { res.status(400).json({ erro: 'Arquivo obrigatório' }); return; }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO midias (titulo, descricao, tipo, categoria, arquivo, destaque, ordem, usuario_id) VALUES (?,?,?,?,?,?,?,?)',
      [titulo, descricao, tipo, categoria || 'terraplenagem', arquivo, destaque ? 1 : 0, ordem || 0, req.usuario?.id]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Mídia criada com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao criar mídia' });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { titulo, descricao, categoria, destaque, ordem, ativo } = req.body;
  try {
    await pool.query(
      'UPDATE midias SET titulo=?, descricao=?, categoria=?, destaque=?, ordem=?, ativo=? WHERE id=?',
      [titulo, descricao, categoria, destaque ? 1 : 0, ordem, ativo !== false ? 1 : 0, req.params.id]
    );
    res.json({ mensagem: 'Mídia atualizada' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
}

export async function deletar(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM midias WHERE id = ?', [req.params.id]
    );
    if (rows[0]?.arquivo) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(rows[0].arquivo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM midias WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Mídia excluída' });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir' });
  }
}

export async function reordenar(req: Request, res: Response): Promise<void> {
  const items: { id: number; ordem: number }[] = req.body;
  try {
    for (const item of items) {
      await pool.query(
        'UPDATE midias SET ordem = ? WHERE id = ?', [item.ordem, item.id]
      );
    }
    res.json({ mensagem: 'Ordem atualizada' });
  } catch {
    res.status(500).json({ erro: 'Erro ao reordenar' });
  }
}