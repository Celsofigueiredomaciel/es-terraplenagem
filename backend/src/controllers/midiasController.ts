import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ── Valores permitidos ────────────────────────────────
const CATEGORIAS_VALIDAS = ['terraplenagem', 'construcao', 'equipamentos', 'obras', 'outros'];
const TIPOS_VALIDOS      = ['foto', 'video'];

// ── Listar mídias (pública) ───────────────────────────
export async function listar(req: Request, res: Response): Promise<void> {
  const { categoria, tipo, destaque } = req.query;

  // ✅ Valida categoria e tipo se fornecidos
  if (categoria && !CATEGORIAS_VALIDAS.includes(categoria as string)) {
    res.status(400).json({ erro: 'Categoria inválida' });
    return;
  }
  if (tipo && !TIPOS_VALIDOS.includes(tipo as string)) {
    res.status(400).json({ erro: 'Tipo inválido' });
    return;
  }

  // ✅ Colunas explícitas — sem SELECT *
  let sql = `SELECT id, titulo, descricao, tipo, categoria,
             arquivo, destaque, ordem, criado_em
             FROM midias WHERE ativo = 1`;
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

// ── Buscar por ID ─────────────────────────────────────
export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, titulo, descricao, tipo, categoria,
              arquivo, destaque, ordem, criado_em
       FROM midias WHERE id = ? AND ativo = 1`, // ✅ sem SELECT *
      [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Mídia não encontrada' });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

// ── Criar mídia (admin) ───────────────────────────────
export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, descricao, tipo, categoria, destaque, ordem } = req.body;
  const arquivo = req.file ? `/uploads/${req.file.filename}` : null;

  if (!arquivo) {
    res.status(400).json({ erro: 'Arquivo obrigatório' });
    return;
  }

  // ✅ Validação de campos obrigatórios
  if (!titulo?.trim() || !tipo) {
    res.status(400).json({ erro: 'Título e tipo são obrigatórios' });
    return;
  }

  // ✅ Valida tipo e categoria
  if (!TIPOS_VALIDOS.includes(tipo)) {
    res.status(400).json({ erro: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}` });
    return;
  }
  const cat = categoria || 'terraplenagem';
  if (!CATEGORIAS_VALIDAS.includes(cat)) {
    res.status(400).json({ erro: `Categoria inválida. Use: ${CATEGORIAS_VALIDAS.join(', ')}` });
    return;
  }

  try {
    const [result]: any = await pool.query(
      `INSERT INTO midias
        (titulo, descricao, tipo, categoria, arquivo, destaque, ordem, usuario_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        titulo.trim(),
        descricao?.trim() || null,
        tipo, cat, arquivo,
        destaque ? 1 : 0,
        Number(ordem) || 0,
        req.usuario?.id
      ]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Mídia criada com sucesso' });
  } catch {
    res.status(500).json({ erro: 'Erro ao criar mídia' });
  }
}

// ── Atualizar mídia (admin) ───────────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, descricao, categoria, destaque, ordem, ativo } = req.body;

  if (!titulo?.trim()) {
    res.status(400).json({ erro: 'Título é obrigatório' });
    return;
  }
  if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
    res.status(400).json({ erro: 'Categoria inválida' });
    return;
  }

  try {
    await pool.query(
      'UPDATE midias SET titulo=?, descricao=?, categoria=?, destaque=?, ordem=?, ativo=? WHERE id=?',
      [
        titulo.trim(),
        descricao?.trim() || null,
        categoria || 'terraplenagem',
        destaque ? 1 : 0,
        Number(ordem) || 0,
        ativo !== false ? 1 : 0,
        req.params.id
      ]
    );
    res.json({ mensagem: 'Mídia atualizada' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
}

// ── Deletar mídia (admin) ─────────────────────────────
export async function deletar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT arquivo FROM midias WHERE id = ?', [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Mídia não encontrada' });
      return;
    }
    // ✅ path.basename já previne path traversal
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

// ── Reordenar mídias (admin) ──────────────────────────
export async function reordenar(req: AuthRequest, res: Response): Promise<void> {
  const items: { id: number; ordem: number }[] = req.body;

  // ✅ Limite de itens por requisição
  if (!Array.isArray(items) || items.length === 0 || items.length > 200) {
    res.status(400).json({ erro: 'Lista inválida — envie entre 1 e 200 itens' });
    return;
  }

  const conn = await pool.getConnection();
  try {
    // ✅ Transação — garante que tudo salva ou nada salva
    await conn.beginTransaction();
    for (const item of items) {
      if (!item.id || typeof item.ordem !== 'number') continue;
      await conn.query(
        'UPDATE midias SET ordem = ? WHERE id = ?', [item.ordem, item.id]
      );
    }
    await conn.commit();
    res.json({ mensagem: 'Ordem atualizada' });
  } catch {
    await conn.rollback();
    res.status(500).json({ erro: 'Erro ao reordenar — operação revertida' });
  } finally {
    conn.release();
  }
}