import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes       from './routes/auth';
import midiasRoutes     from './routes/midias';
import orcamentosRoutes from './routes/orcamentos';
import blogRoutes       from './routes/blog';
import configRoutes     from './routes/config';
import historiaRoutes   from './routes/historia';
import produtosRoutes   from './routes/produtos';
import usuariosRoutes from './routes/usuarios';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],              // ✅ libera onclick= no HTML
      styleSrc:      ["'self'", "'unsafe-inline'",
                     "https://fonts.googleapis.com"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com"],
      imgSrc:        ["'self'", "data:", "blob:"],
      connectSrc:    ["'self'"],
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { erro: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use('/api/auth/login', loginLimit);

// ── Middlewares ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Estáticos ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rotas da API ─────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/midias',     midiasRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/blog',       blogRoutes);
app.use('/api/config',     configRoutes);
app.use('/api/historia',   historiaRoutes);
app.use('/api/produtos',   produtosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// ── Fallback: entrega o frontend ─────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// ── Inicia o servidor ────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚜 E.S Terraplenagem — servidor rodando`);
  console.log(`   http://localhost:${PORT}\n`);
});


export default app;