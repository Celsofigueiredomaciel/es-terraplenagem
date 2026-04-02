import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ── Validação de variáveis obrigatórias ──────────────
const requiredEnvs = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
requiredEnvs.forEach(key => {
  if (process.env[key] === undefined) {
    console.error(`ERRO FATAL: variável de ambiente "${key}" não definida`);
    process.exit(1);
  }
});

// ── Pool de conexão ──────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

export default pool;