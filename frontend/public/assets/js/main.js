/* =====================================================
   E.S Terraplenagem — main.js
   ===================================================== */

const API = '/api';

// ── MENU MOBILE ─────────────────────────────────────
const menuBtn  = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn?.addEventListener('click', () => navLinks?.classList.toggle('aberto'));
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('aberto')));

// ── SCROLL REVEAL ────────────────────────────────────
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── NAVBAR SOMBRA AO ROLAR ───────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('nav')?.style.setProperty(
    'box-shadow', window.scrollY > 50 ? '0 4px 30px rgba(0,0,0,.6)' : 'none'
  );
});

// ── CARREGAR CONFIGURAÇÕES DO BANCO ──────────────────
async function carregarConfig() {
  try {
    const res = await fetch(`${API}/config`);
    const cfg = await res.json();
    const tel  = cfg.whatsapp || '5500000000000';
    const waURL = `https://wa.me/${tel}`;

    document.querySelectorAll('[data-wa]').forEach(el => {
      if (el.tagName === 'A') el.href = waURL;
    });
    document.querySelectorAll('[data-cfg]').forEach(el => {
      const chave = el.getAttribute('data-cfg');
      if (chave && cfg[chave]) el.textContent = cfg[chave];
    });

    if (cfg.anos_mercado)        document.querySelectorAll('.stat-anos').forEach(e => e.textContent = cfg.anos_mercado + '+');
    if (cfg.projetos_concluidos) document.querySelectorAll('.stat-projetos').forEach(e => e.textContent = cfg.projetos_concluidos + '+');
  } catch (e) {
    console.warn('Config não carregada:', e);
  }
}

// ── CARREGAR GALERIA ─────────────────────────────────
async function carregarGaleria() {
  const grid = document.getElementById('galeria-grid');
  if (!grid) return;
  try {
    const res   = await fetch(`${API}/midias?ativo=1`);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) return;

    grid.innerHTML = '';
    console.log('Mídias recebidas:', items);
    items.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'galeria-item reveal';
      div.setAttribute('data-categoria', m.categoria);

      if (m.tipo === 'video') {
        div.innerHTML = `
          <video autoplay muted loop playsinline>
            <source src="${m.arquivo}" type="video/mp4">
          </video>
          <div class="galeria-overlay">
            <div style="font-size:2rem">▶</div>
            <div class="galeria-overlay-titulo">${m.titulo}</div>
          </div>`;
      } else {
        div.innerHTML = `
          <img src="${m.arquivo}" alt="${m.titulo}" loading="${i < 4 ? 'eager' : 'lazy'}">
          <div class="galeria-overlay" onclick="abrirModal('${m.arquivo}','${m.titulo}')">
            <div style="font-size:2rem">🔍</div>
            <div class="galeria-overlay-titulo">${m.titulo}</div>
          </div>`;
      }
      grid.appendChild(div);
      observer.observe(div);
    });
  } catch (e) {
    console.warn('Galeria não carregada:', e);
  }
}

// ── FILTROS DA GALERIA ───────────────────────────────
document.querySelectorAll('.filtro').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    const cat = btn.getAttribute('data-cat');
    document.querySelectorAll('.galeria-item').forEach(item => {
      item.style.display = (cat === 'todos' || item.getAttribute('data-categoria') === cat) ? '' : 'none';
    });
  });
});

// ── MODAL DE FOTO ────────────────────────────────────
function abrirModal(src, titulo) {
  const modal = document.getElementById('modal');
  const img   = document.getElementById('modal-img');
  if (modal && img) { img.src = src; img.alt = titulo; modal.classList.add('aberto'); }
}
function fecharModal() {
  document.getElementById('modal')?.classList.remove('aberto');
}
document.getElementById('modal')?.addEventListener('click', function(e) {
  if (e.target === this) fecharModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

// ── FORMULÁRIO DE ORÇAMENTO ──────────────────────────
const form = document.getElementById('form-orcamento');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg  = document.getElementById('form-msg');
  const btn  = form.querySelector('button[type=submit]');
  const dados = Object.fromEntries(new FormData(form));
  btn.disabled = true; btn.textContent = 'Enviando...';

  try {
    const res  = await fetch(`${API}/orcamentos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const json = await res.json();
    if (res.ok) {
      msg.className = 'form-msg ok'; msg.textContent = '✅ ' + json.mensagem;
      form.reset();
    } else {
      msg.className = 'form-msg erro'; msg.textContent = '❌ ' + (json.erro || 'Erro ao enviar.');
    }
  } catch {
    msg.className = 'form-msg erro'; msg.textContent = '❌ Sem conexão. Tente pelo WhatsApp.';
  }
  btn.disabled = false; btn.textContent = 'Enviar Solicitação';
  msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ── CARREGAR BLOG ────────────────────────────────────
async function carregarBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  try {
    const res  = await fetch(`${API}/blog?limite=3`);
    const data = await res.json();
    if (!data.dados?.length) { grid.closest('section')?.remove(); return; }

    grid.innerHTML = '';
    data.dados.forEach(post => {
      const data_fmt = post.publicado_em
        ? new Date(post.publicado_em).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
        : '';
      grid.innerHTML += `
        <article class="post-card reveal">
          <div class="post-card-img">
            ${post.capa
              ? `<img src="${post.capa}" alt="${post.titulo}" loading="lazy">`
              : '<div style="background:#1a1a1a;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem">📰</div>'
            }
          </div>
          <div class="post-card-body">
            <div class="post-card-data">${data_fmt}</div>
            <h3 class="post-card-titulo">${post.titulo}</h3>
            <p class="post-card-resumo">${post.resumo || ''}</p>
            <a href="/blog.html?slug=${post.slug}" class="post-card-link">Ler mais →</a>
          </div>
        </article>`;
    });
    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } catch (e) {
    console.warn('Blog não carregado:', e);
  }
}

// ── CARREGAR PRODUTOS ─────────────────────────────────
async function carregarProdutos() {
  const grid = document.getElementById('produtos-grid');
  if (!grid) return;
  try {
    const res   = await fetch(`${API}/produtos`);
    const items = await res.json();

    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = '<p style="color:#555">Em breve nossos produtos estarão disponíveis aqui.</p>';
      return;
    }

    grid.innerHTML = items.map(p => `
      <div class="reveal" style="background:#1a1a1a;border-radius:6px;
                                  overflow:hidden;border-bottom:3px solid transparent;
                                  transition:border-color .3s,transform .3s"
           onmouseover="this.style.borderColor='#FFD700';this.style.transform='translateY(-4px)'"
           onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)'">
        <div style="height:200px;overflow:hidden;background:#111">
          <img src="${p.arquivo}" alt="${p.nome}"
               style="width:100%;height:100%;object-fit:cover;transition:transform .4s"
               onmouseover="this.style.transform='scale(1.05)'"
               onmouseout="this.style.transform='scale(1)'">
        </div>
        <div style="padding:1.25rem">
          <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;
                     letter-spacing:2px;color:#FFD700;margin-bottom:.5rem">${p.nome}</h3>
          <p style="font-size:.88rem;color:#888;line-height:1.6">${p.descricao || ''}</p>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } catch (e) {
    console.warn('Produtos não carregados:', e);
  }
}

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarConfig();
  carregarGaleria();
  carregarBlog();
  carregarProdutos();
});

