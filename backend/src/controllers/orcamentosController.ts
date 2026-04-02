import { Request, Response } from 'express';
import pool from '../config/db';
import rateLimit from 'express-rate-limit';

// ── Rate limit para formulário público ───────────────
export const orcamentoLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 orçamentos por IP por hora
  message: { erro: 'Muitas solicitações. Tente novamente em 1 hora.' }
});

// ── Valores permitidos para status ───────────────────
const STATUS_VALIDOS = ['novo', 'em_andamento', 'respondido', 'arquivado'];

// ── Sanitização simples de texto ─────────────────────
function sanitizar(texto: string): string {
  return texto.trim().replace(/[<>]/g, '');
}

// ── Criar orçamento (rota pública) ───────────────────
export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, telefone, email, servico, descricao } = req.body;

  if (!nome || !telefone || !servico || !descricao) {
    res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    return;
  }

  // ✅ Validação de tamanho dos campos
  if (nome.length > 100 || servico.length > 100 || descricao.length > 2000) {
    res.status(400).json({ erro: 'Dados inválidos — campos muito longos' });
    return;
  }

  // ✅ Validação básica de e-mail
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ erro: 'E-mail inválido' });
    return;
  }

  try {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    await pool.query(
      'INSERT INTO orcamentos (nome, telefone, email, servico, descricao, ip_origem) VALUES (?,?,?,?,?,?)',
      [
        sanitizar(nome),
        sanitizar(telefone),
        email ? sanitizar(email) : null,
        sanitizar(servico),
        sanitizar(descricao),
        ip
      ]
    );
    res.status(201).json({ mensagem: 'Orçamento recebido! Entraremos em contato em breve.' });
  } catch {
    res.status(500).json({ erro: 'Erro ao registrar orçamento' });
  }
}

// ── Listar orçamentos (admin) ─────────────────────────
export async function listar(req: Request, res: Response): Promise<void> {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const limite = Math.min(50, Math.max(1, Number(req.query.limite) || 20)); // ✅ teto de 50
  const offset = (pagina - 1) * limite;
  const { status } = req.query;

  // ✅ Valida o status se fornecido
  if (status && !STATUS_VALIDOS.includes(status as string)) {
    res.status(400).json({ erro: 'Status inválido' });
    return;
  }

  let sql = `SELECT id, nome, telefone, email, servico, descricao,
             status, notas_admin, criado_em, respondido_em
             FROM orcamentos`; // ✅ sem ip_origem na listagem
  const params: any[] = [];

  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY criado_em DESC LIMIT ? OFFSET ?';
  params.push(limite, offset);

  try {
    const [rows] = await pool.query(sql, params);
    const [total]: any = await pool.query(
      'SELECT COUNT(*) as total FROM orcamentos' + (status ? ' WHERE status = ?' : ''),
      status ? [status] : []
    );
    res.json({ dados: rows, total: total[0].total, pagina, limite });
  } catch {
    res.status(500).json({ erro: 'Erro ao listar orçamentos' });
  }
}

// ── Buscar por ID (admin) ─────────────────────────────
export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, nome, telefone, email, servico, descricao,
              status, notas_admin, criado_em, respondido_em
       FROM orcamentos WHERE id = ?`, // ✅ sem SELECT *
      [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ erro: 'Orçamento não encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
}

// ── Atualizar status (admin) ──────────────────────────
export async function atualizarStatus(req: Request, res: Response): Promise<void> {
  const { status, notas_admin } = req.body;

  // ✅ Valida se o status é um valor permitido
  if (!status || !STATUS_VALIDOS.includes(status)) {
    res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });
    return;
  }

  try {
    const respondido = status === 'respondido' ? new Date() : null;
    await pool.query(
      'UPDATE orcamentos SET status = ?, notas_admin = ?, respondido_em = ? WHERE id = ?',
      [status, notas_admin ? sanitizar(notas_admin) : null, respondido, req.params.id]
    );
    res.json({ mensagem: 'Status atualizado' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
}

// ── Remover orçamento (admin) ─────────────────────────
export async function remover(req: Request, res: Response): Promise<void> {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM orcamentos WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ erro: 'Orçamento não encontrado' });
      return;
    }
    res.json({ mensagem: 'Orçamento excluído' });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir' });
  }
}

// ── Remover por período (admin) ───────────────────────
export async function removerPorPeriodo(req: Request, res: Response): Promise<void> {
  const meses = parseInt(req.params.meses);

  // ✅ Valida o período — entre 1 e 60 meses
  if (isNaN(meses) || meses < 1 || meses > 60) {
    res.status(400).json({ erro: 'Período inválido. Use entre 1 e 60 meses.' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'DELETE FROM orcamentos WHERE criado_em < DATE_SUB(NOW(), INTERVAL ? MONTH)',
      [meses]
    );
    res.json({ mensagem: `${result.affectedRows} orçamento(s) excluído(s)` });
  } catch {
    res.status(500).json({ erro: 'Erro ao excluir por período' });
  }
}
// ── Relatório de orçamentos (admin) ──────────────────
export async function relatorio(req: Request, res: Response): Promise<void> {
  const { dataInicio, dataFim, status, servico } = req.query;

  let sql = `SELECT id, nome, telefone, email, servico, descricao,
             status, criado_em, respondido_em, notas_admin
             FROM orcamentos WHERE 1=1`;
  const params: any[] = [];

  if (dataInicio) { sql += ' AND criado_em >= ?'; params.push(dataInicio); }
  if (dataFim)    { sql += ' AND criado_em <= ?'; params.push(dataFim + ' 23:59:59'); }
  if (status && STATUS_VALIDOS.includes(status as string)) {
    sql += ' AND status = ?'; params.push(status);
  }
  if (servico) { sql += ' AND servico = ?'; params.push(servico); }

  sql += ' ORDER BY criado_em DESC';

  try {
    const [rows]: any = await pool.query(sql, params);

    // ── Totais por status ─────────────────────────────
    const totais = { novo: 0, em_analise: 0, respondido: 0, cancelado: 0, total: rows.length };
    rows.forEach((r: any) => {
      if (totais[r.status as keyof typeof totais] !== undefined) {
        (totais[r.status as keyof typeof totais] as number)++;
      }
    });

    res.json({ dados: rows, totais });
  } catch {
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
}
