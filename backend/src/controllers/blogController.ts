import { Request, Response } from 'express';
import slugify from 'slugify';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function listar(req: Request, res: Response): Promise<void> {
  const { pagina = 1, limite = 9, apenasPublicados = true } = req.query;
  const offset = (Number(pagina) - 1) * Number(limite);
  const filtro = apenasPublicados !== 'false' ? 'WHERE publicado = 1' : '';
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, slug, resumo, capa, publicado_em, criado_em
       FROM posts ${filtro}
       ORDER BY publicado_em DESC LIMIT ? OFFSET ?`,
      [Number(limite), offset]
    );
    const [total]: any = await pool.query(
      `SELECT COUNT(*) as total FROM posts ${filtro}`
    );
    res.json({ dados: rows, total: total[0].total });
  } catch {
    res.status(500).json({ erro: 'Erro ao listar posts' });
  }
}

export async function buscarPorSlug(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM posts WHERE slug = ? AND publicado = 1', [req.params.slug]
    );
    if (!rows[0]) { res.status(404).json({ erro: 'Post não encontrado' }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, resumo, conteudo, publicado } = req.body;
  const capa = req.file ? `/uploads/${req.file.filename}` : null;
  const slug = slugify(titulo, { lower: true, strict: true, locale: 'pt' });
  try {
    const [r]: any = await pool.query(
      'INSERT INTO posts (titulo, slug, resumo, conteudo, capa, publicado, publicado_em, usuario_id) VALUES (?,?,?,?,?,?,?,?)',
      [titulo, slug, resumo, conteudo, capa, publicado ? 1 : 0, publicado ? new Date() : null, req.usuario?.id]
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

export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { titulo, resumo, conteudo, publicado } = req.body;
  const capa = req.file ? `/uploads/${req.file.filename}` : undefined;
  const slug = slugify(titulo, { lower: true, strict: true, locale: 'pt' });
  try {
    const capaSQL = capa ? ', capa = ?' : '';
    const params: any[] = [titulo, slug, resumo, conteudo, publicado ? 1 : 0, publicado ? new Date() : null];
    if (capa) params.push(capa);
    params.push(req.params.id);
    await pool.query(
      `UPDATE posts SET titulo=?, slug=?, resumo=?, conteudo=?, publicado=?, publicado_em=?${capaSQL} WHERE id=?`,
      params
    );
    res.json({ mensagem: 'Post atualizado', slug });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar post' });
  }
}

export async function deletar(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Post excluído' });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir' });
  }
}