import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// ── Chaves públicas — visíveis sem autenticação ───────
const CHAVES_PUBLICAS = [
  'empresa_nome', 'empresa_telefone', 'empresa_email',
  'empresa_endereco', 'empresa_whatsapp', 'empresa_instagram',
  'empresa_facebook', 'empresa_descricao'
];

// ── Todas as chaves editáveis (admin) ─────────────────
const CHAVES_EDITAVEIS = [
  ...CHAVES_PUBLICAS,
  'seo_titulo', 'seo_descricao', 'seo_keywords',
  'rodape_texto', 'banner_titulo', 'banner_subtitulo'
];

// ── Listar configurações públicas (sem autenticação) ──
export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      // ✅ Só retorna chaves públicas — nunca expõe chaves internas
      `SELECT chave, valor FROM configuracoes WHERE chave IN (${CHAVES_PUBLICAS.map(() => '?').join(',')})`,
      CHAVES_PUBLICAS
    );
    const config: Record<string, string> = {};
    rows.forEach((r: any) => { config[r.chave] = r.valor; });
    res.json(config);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar configurações' });
  }
}

// ── Listar todas as configurações (admin) ─────────────
export async function listarAdmin(_req: AuthRequest, res: Response): Promise<void> {
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

// ── Atualizar configuração (admin) ────────────────────
export async function atualizar(req: AuthRequest, res: Response): Promise<void> {
  const { chave } = req.params;
  const { valor }  = req.body;

  // ✅ Só permite atualizar chaves da whitelist
  if (!CHAVES_EDITAVEIS.includes(chave)) {
    res.status(400).json({ erro: 'Chave não permitida' });
    return;
  }

  // ✅ Validação do valor
  if (valor === undefined || valor === null) {
    res.status(400).json({ erro: 'Valor é obrigatório' });
    return;
  }
  if (String(valor).length > 500) {
    res.status(400).json({ erro: 'Valor muito longo — máximo 500 caracteres' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE configuracoes SET valor = ? WHERE chave = ?',
      [String(valor).trim(), chave]
    );
    // ✅ Verifica se a chave existia
    if (result.affectedRows === 0) {
      res.status(404).json({ erro: 'Configuração não encontrada' });
      return;
    }
    res.json({ mensagem: 'Configuração atualizada' });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar configuração' });
  }
}