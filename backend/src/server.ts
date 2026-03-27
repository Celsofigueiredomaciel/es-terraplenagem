import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes       from './routes/auth';
import midiasRoutes     from './routes/midias';
import orcamentosRoutes from './routes/orcamentos';
import blogRoutes       from './routes/blog';
import configRoutes     from './routes/config';
import historiaRoutes from './routes/historia'
import produtosRoutes from './routes/produtos';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Serve uploads (fotos/vídeos enviados pelo admin)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rotas da API ─────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/midias',     midiasRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/blog',       blogRoutes);
app.use('/api/config',     configRoutes);
app.use('/api/historia', historiaRoutes);
app.use('/api/produtos', produtosRoutes);

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