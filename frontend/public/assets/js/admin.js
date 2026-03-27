/* =====================================================
   E.S Terraplenagem — admin.js
   ===================================================== */

// ── AUTENTICAÇÃO ─────────────────────────────────────
function getToken() { return localStorage.getItem('es_token'); }

function checarAuth() {
  if (!getToken()) { location.href = '/admin/login.html'; return false; }
  const usuario = JSON.parse(localStorage.getItem('es_usuario') || '{}');
  const el = document.getElementById('sidebar-user');
  if (el) el.textContent = `👤 ${usuario.nome || usuario.email}`;
  return true;
}

function sair() {
  localStorage.removeItem('es_token');
  localStorage.removeItem('es_usuario');
  location.href = '/admin/login.html';
}

// ── HEADERS AUTENTICADOS ─────────────────────────────
function authHeaders(isJson = true) {
  const h = { Authorization: 'Bearer ' + getToken() };
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
}

// ── TOAST ────────────────────────────────────────────
function toast(msg, tipo = 'ok', duracao = 3500) {
  let el = document.getElementById('toast-global');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-global';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = (tipo === 'ok' ? '✅ ' : '❌ ') + msg;
  el.className = `toast ${tipo}`;
  setTimeout(() => { el.className = 'toast'; }, duracao);
}

// ── CONFIRMAR EXCLUSÃO ───────────────────────────────
function confirmar(msg, callback) {
  if (window.confirm(msg)) callback();
}

// ── FORMATAR DATA ────────────────────────────────────
function formatarData(dt) {
  return new Date(dt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => checarAuth());

// Expõe globalmente
window.sair        = sair;
window.toast       = toast;
window.confirmar   = confirmar;
window.authHeaders = authHeaders;
window.getToken    = getToken;
window.formatarData = formatarData;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.abrirModal = function(src, titulo) {
  const modal = document.getElementById('modal');
  const img   = document.getElementById('modal-img');
  if (modal && img) { img.src = src; img.alt = titulo; modal.classList.add('aberto'); }
};