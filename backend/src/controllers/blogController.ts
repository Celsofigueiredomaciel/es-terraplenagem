import { Request, Response } from 'express';
import slugify from 'slugify';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ── Listar posts ─────────────────────────────────────
export async function listar(req: Request, res: Response): Promise<void> {
  const pagina  = Math.max(1, Number(req.query.pagina) || 1);
  const limite  = Math.min(50, Math.max(1, Number(req.query.limite) || 9));
  const offset  = (pagina - 1) * limite;
  const filtro  = req.query.apenasPublicados !== 'false' ? 'WHERE publicado = 1' : '';

  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, slug, resumo, capa, publicado_em, criado_em
       FROM posts ${filtro}
       ORDER BY publicado_em DESC LIMIT ? OFFSET ?`,
      [limite, offset]
    );
    const [total]: any = await pool.query(
      `SELECT COUNT(*) as total FROM posts ${filtro}`
    );
    res.json({ dados: rows, total: total[0].total });
  } catch {
    res.status(500).json({ erro: 'Erro ao listar posts' });
  }
}

// ── Buscar por slug ───────────────────────────────────
export async function buscarPorSlug(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, titulo, slug, resumo, conteudo, capa, publicado_em, criado_em
       FROM posts WHERE slug = ? AND publicado = 1`,
      [req.params.slug]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Post não encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

// ── Criar post ────────────────────────────────────────
export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, resumo, conteudo, publicado } = req.body;

  if (!titulo?.trim() || !conteudo?.trim()) {
    res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
    return;
  }

  const capa = req.file ? `/uploads/${req.file.filename}` : null;
  const slug = slugify(titulo, { lower: true, strict: true, locale: 'pt' });

  try {
    const [r]: any = await pool.query(
      `INSERT INTO posts
        (titulo, slug, resumo, conteudo, capa, publicado, publicado_em, usuario_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        titulo.trim(), slug, resumo?.trim() || null,
        conteudo.trim(), capa, publicado ? 1 : 0,
        publicado ? new Date() : null, req.usuario?.id
      ]
    );
    res.status(201).json({ id: r.insertId, slug });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ erro: 'Já existe um post com este título' });
    } else {
      res.status(500).json({ erro: 'Erro ao criar post' });
    }
  }
}

// ── Atualizar post ────────────────────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, resumo, conteudo, publicado } = req.body;

  if (!titulo?.trim() || !conteudo?.trim()) {
    res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
    return;
  }

  const capa = req.file ? `/uploads/${req.file.filename}` : undefined;
  const slug = slugify(titulo, { lower: true, strict: true, locale: 'pt' });

  try {
    const capaSQL  = capa ? ', capa = ?' : '';
    const params: any[] = [
      titulo.trim(), slug, resumo?.trim() || null,
      conteudo.trim(), publicado ? 1 : 0,
      publicado ? new Date() : null
    ];
    if (capa) params.push(capa);
    params.push(req.params.id);

    await pool.query(
      `UPDATE posts
       SET titulo=?, slug=?, resumo=?, conteudo=?, publicado=?, publicado_em=?${capaSQL}
       WHERE id=?`,
      params
    );
    res.json({ mensagem: 'Post atualizado', slug });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar post' });
  }
}

// ── Deletar post ──────────────────────────────────────
export async function deletar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM posts WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ erro: 'Post não encontrado' });
      return;
    }
    res.json({ mensagem: 'Post excluído' });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir' });
  }
}
