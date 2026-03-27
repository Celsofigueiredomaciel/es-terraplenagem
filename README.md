# E.S Terraplenagem e Construções LTDA — Site Institucional

Site institucional completo com painel administrativo.

## Stack
- **Backend:** Node.js + TypeScript + Express
- **Banco:** MySQL
- **Frontend:** HTML + CSS + JavaScript puro
- **Auth:** JWT

## Funcionalidades
- Site institucional com slider, galeria, blog e formulário de orçamento
- Painel admin com login JWT
- Upload de fotos e vídeos
- Seção "Nossa História" com slider gerenciável
- Vitrine de produtos
- Dashboard com estatísticas

## Como rodar localmente
```bash
cd backend
npm install
cp .env.example .env  # configure as variáveis
npm run dev
```
Acesse: http://localhost:3000

## Banco de dados
Importe os arquivos da pasta `database/`:
- `schema.sql` — estrutura das tabelas
- `seed.sql` — dados iniciais
