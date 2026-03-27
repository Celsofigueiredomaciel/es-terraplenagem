import { Request, Response } from 'express';
import pool from '../config/db';

export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT chave, valor FROM configuracoes'
    );
    const config: Record<string, string> = {};
    rows.forEach((r: any) => { config[r.chave] = r.valor; });
    res.json(config);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar configurações' });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { valor } = req.body;
  try {
    await pool.query(
      'UPDATE configuracoes SET valor = ? WHERE chave = ?',
      [valor, req.params.chave]
    );
    res.json({ mensagem: 'Configuração atualizada' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar configuração' });
  }
}