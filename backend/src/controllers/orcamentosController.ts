import { Request, Response } from 'express';
import pool from '../config/db';

export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, telefone, email, servico, descricao } = req.body;
  if (!nome || !telefone || !servico || !descricao) {
    res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    return;
  }
  try {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    await pool.query(
      'INSERT INTO orcamentos (nome, telefone, email, servico, descricao, ip_origem) VALUES (?,?,?,?,?,?)',
      [nome, telefone, email || null, servico, descricao, ip]
    );
    res.status(201).json({ mensagem: 'Orçamento recebido! Entraremos em contato em breve.' });
  } catch {
    res.status(500).json({ erro: 'Erro ao registrar orçamento' });
  }
}

export async function listar(req: Request, res: Response): Promise<void> {
  const { status, pagina = 1, limite = 20 } = req.query;
  const offset = (Number(pagina) - 1) * Number(limite);
  let sql = 'SELECT * FROM orcamentos';
  const params: any[] = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY criado_em DESC LIMIT ? OFFSET ?';
  params.push(Number(limite), offset);
  try {
    const [rows] = await pool.query(sql, params);
    const [total]: any = await pool.query(
      'SELECT COUNT(*) as total FROM orcamentos' + (status ? ' WHERE status = ?' : ''),
      status ? [status] : []
    );
    res.json({
      dados: rows,
      total: total[0].total,
      pagina: Number(pagina),
      limite: Number(limite)
    });
  } catch {
    res.status(500).json({ erro: 'Erro ao listar orçamentos' });
  }
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM orcamentos WHERE id = ?', [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ erro: 'Orçamento não encontrado' }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

export async function atualizarStatus(req: Request, res: Response): Promise<void> {
  const { status, notas_admin } = req.body;
  try {
    const respondido = status === 'respondido' ? 'NOW()' : 'NULL';
    await pool.query(
      `UPDATE orcamentos SET status = ?, notas_admin = ?, respondido_em = ${respondido} WHERE id = ?`,
      [status, notas_admin || null, req.params.id]
    );
    res.json({ mensagem: 'Status atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
}

// DELETE /api/orcamentos/:id — exclui unitário
export async function remover(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM orcamentos WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Orçamento excluído' });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir' });
  }
}

// DELETE /api/orcamentos/periodo/:meses — exclui por período
export async function removerPorPeriodo(req: Request, res: Response): Promise<void> {
  try {
    const meses = parseInt(req.params.meses) || 6;
    const [result]: any = await pool.query(
      'DELETE FROM orcamentos WHERE criado_em < DATE_SUB(NOW(), INTERVAL ? MONTH)',
      [meses]
    );
    res.json({ mensagem: `${result.affectedRows} orçamento(s) excluído(s)` });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir por período' });
  }
}