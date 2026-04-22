// ============================================================
// admin.js — Painel Administrativo BikeFit
// ============================================================

import sb from './supabase.js';

// ============================================================
// INICIALIZAÇÃO — Auth guard
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showApp(session.user.email);
  } else {
    showLogin();
  }

  initLogin();
  initLogout();
  initNavigation();
  initModal();
});

const ADMIN_THEME_KEY = 'bikefit_admin_theme';

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem(ADMIN_THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.body.dataset.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(ADMIN_THEME_KEY, next);
  });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display   = 'none';
}

function showApp(email) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display    = 'flex';
  document.getElementById('admin-email-display').textContent = email;
  loadPanel('dashboard');
}

// ============================================================
// LOGIN
// ============================================================
function initLogin() {
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');
    const errEl    = document.getElementById('login-error');

    btn.disabled = true;
    btn.textContent = 'Entrando...';
    errEl.classList.remove('visible');

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      errEl.textContent = 'E-mail ou senha inválidos.';
      errEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }

    showApp(data.user.email);
  });
}

// ============================================================
// LOGOUT
// ============================================================
function initLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    showLogin();
  });
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
const PANEL_TITLES = {
  dashboard:    'Dashboard',
  testimonials: 'Depoimentos',
  faq:          'FAQ',
  content:      'Textos da LP',
  settings:     'Contato & Redes',
};

function initNavigation() {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      document.querySelectorAll('.admin-nav-item').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
      document.getElementById('panel-title').textContent = PANEL_TITLES[panel] || panel;
      loadPanel(panel);
    });
  });
}

function loadPanel(panel) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${panel}`)?.classList.add('active');

  switch (panel) {
    case 'dashboard':    loadDashboard();    break;
    case 'testimonials': loadTestimonials(); break;
    case 'faq':          loadFAQ();          break;
    case 'content':      loadContent();      break;
    case 'settings':     loadSettings();     break;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
const FUNNEL_STEPS = ['page_view', 'cta_booking_click', 'email_fab_click'];
const FUNNEL_LABELS = {
  page_view: 'Visualizações',
  cta_booking_click: 'Cliques em agendar',
  email_fab_click: 'Cliques no e-mail',
};

async function loadDashboard() {
  const rangeSel = document.getElementById('dashboard-range');
  if (rangeSel && !rangeSel._initialized) {
    rangeSel._initialized = true;
    rangeSel.addEventListener('change', () => loadDashboard());
  }

  const days = parseInt(rangeSel?.value || '30', 10);
  const fromDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
  const root = document.getElementById('dashboard-root');
  if (!root) return;

  root.innerHTML = '<div class="admin-card"><p style="color:var(--color-text-muted)">Atualizando dashboard...</p></div>';

  const { data, error } = await sb
    .from('bfr_analytics_events')
    .select('event_name,session_id,created_at,event_meta')
    .gte('created_at', fromDate)
    .in('event_name', FUNNEL_STEPS);

  if (error) {
    root.innerHTML = '<div class="admin-card"><p style="color:#ff8a8a">Erro ao carregar analytics. Verifique a tabela e as policies no Supabase.</p></div>';
    return;
  }

  const { data: ratingData } = await sb
    .from('bfr_testimonials')
    .select('rating')
    .eq('active', true)
    .eq('approved', true);

  const events = data || [];
  const metrics = buildDashboardMetrics(events, days, ratingData || []);
  root.innerHTML = renderDashboard(metrics);
}

function buildDashboardMetrics(events, days, approvedRatings) {
  const totals = Object.fromEntries(FUNNEL_STEPS.map(step => [step, 0]));
  const sessions = new Set();
  const sourceCount = {};
  const daily = {};

  events.forEach((evt) => {
    if (!FUNNEL_STEPS.includes(evt.event_name)) return;
    totals[evt.event_name] += 1;
    if (evt.session_id) sessions.add(evt.session_id);

    const day = evt.created_at.slice(0, 10);
    if (!daily[day]) {
      daily[day] = { page_view: 0, cta_booking_click: 0, email_fab_click: 0 };
    }
    daily[day][evt.event_name] += 1;

    if (evt.event_name === 'cta_booking_click') {
      const source = evt.event_meta?.source || 'other';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    }
  });

  const ctrBooking = totals.page_view ? (totals.cta_booking_click / totals.page_view) * 100 : 0;
  const ctrEmail = totals.page_view ? (totals.email_fab_click / totals.page_view) * 100 : 0;
  const bookingDrop = totals.page_view ? 100 - ctrBooking : 0;
  const emailDrop = totals.cta_booking_click ? 100 - ((totals.email_fab_click / totals.cta_booking_click) * 100) : 0;
  const ranking = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgRating = approvedRatings.length
    ? approvedRatings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / approvedRatings.length
    : 0;

  const dailyKeys = Array.from({ length: days }, (_, idx) => {
    const d = new Date(Date.now() - ((days - idx - 1) * 24 * 60 * 60 * 1000));
    return d.toISOString().slice(0, 10);
  });

  return {
    totals,
    sessions: sessions.size,
    ctrBooking,
    ctrEmail,
    bookingDrop,
    emailDrop,
    avgRating,
    approvedRatingsCount: approvedRatings.length,
    ranking,
    dailySeries: dailyKeys.map((day) => ({ day, ...(daily[day] || { page_view: 0, cta_booking_click: 0, email_fab_click: 0 }) })),
  };
}

function renderDashboard(metrics) {
  const funnelRows = FUNNEL_STEPS.map((step, idx) => {
    const value = metrics.totals[step];
    const prev = idx === 0 ? value : metrics.totals[FUNNEL_STEPS[idx - 1]];
    const conversion = idx === 0 ? 100 : (prev ? (value / prev) * 100 : 0);
    return `
      <div class="funnel-row">
        <div class="funnel-row__header">
          <strong>${FUNNEL_LABELS[step]}</strong>
          <span>${value} (${conversion.toFixed(1)}%)</span>
        </div>
        <div class="funnel-row__track">
          <div class="funnel-row__bar" style="width:${Math.max(2, conversion)}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  const dailyMax = Math.max(1, ...metrics.dailySeries.map(d => d.page_view));
  const dailyRows = metrics.dailySeries.slice(-12).map((d) => {
    const width = (d.page_view / dailyMax) * 100;
    return `
      <div class="daily-row">
        <span class="daily-row__date">${formatDate(d.day)}</span>
        <div class="daily-row__track">
          <div class="daily-row__bar" style="width:${Math.max(2, width)}%;"></div>
        </div>
        <span class="daily-row__values">${d.page_view}/${d.cta_booking_click}/${d.email_fab_click}</span>
      </div>
    `;
  }).join('');

  const rankingHtml = metrics.ranking.length
    ? metrics.ranking.map(([source, total]) => `<li><strong>${source}</strong>: ${total}</li>`).join('')
    : '<li>Nenhum clique de agendamento no período.</li>';

  return `
    <div class="dashboard-kpi-grid">
      <div class="admin-card dashboard-kpi-card"><div class="admin-card__title">Sessões únicas</div><div class="dashboard-kpi-value">${metrics.sessions}</div></div>
      <div class="admin-card dashboard-kpi-card"><div class="admin-card__title">CTR Agendamento</div><div class="dashboard-kpi-value">${metrics.ctrBooking.toFixed(1)}%</div></div>
      <div class="admin-card dashboard-kpi-card"><div class="admin-card__title">CTR E-mail</div><div class="dashboard-kpi-value">${metrics.ctrEmail.toFixed(1)}%</div></div>
      <div class="admin-card dashboard-kpi-card"><div class="admin-card__title">Queda Agend. → E-mail</div><div class="dashboard-kpi-value">${metrics.emailDrop.toFixed(1)}%</div></div>
      <div class="admin-card dashboard-kpi-card"><div class="admin-card__title">Média de nota</div><div class="dashboard-kpi-value">${metrics.avgRating.toFixed(1)} / 5</div><div class="dashboard-kpi-meta">${metrics.approvedRatingsCount} aprovados</div></div>
    </div>

    <div class="dashboard-grid">
      <div class="admin-card dashboard-section-card">
        <div class="admin-card__title">Funil</div>
        ${funnelRows}
        <p class="dashboard-note">Queda Visita → Agendar: ${metrics.bookingDrop.toFixed(1)}%</p>
      </div>
      <div class="admin-card dashboard-section-card">
        <div class="admin-card__title">Série diária (PV / Agend. / E-mail)</div>
        ${dailyRows}
      </div>
    </div>

    <div class="admin-card dashboard-section-card">
      <div class="admin-card__title">Origem dos cliques de agendamento</div>
      <ul class="dashboard-ranking">${rankingHtml}</ul>
    </div>
  `;
}

// ============================================================
// DEPOIMENTOS
// ============================================================
async function loadTestimonials() {
  initTestimonialShareTools();
  const { data, error } = await sb
    .from('bfr_testimonials')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) { showToast('Erro ao carregar depoimentos.', 'error'); return; }
  const testimonials = data || [];
  renderTestimonials(testimonials);
  updateTestimonialMetrics(testimonials);
}

function renderTestimonials(list) {
  const tbody = document.getElementById('testimonials-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted)">Nenhum depoimento cadastrado.</td></tr>`;
    return;
  }

  const statusLabel = (t) => {
    if (t.approved && t.active) return { text: 'Aprovado', cls: 'badge--active' };
    if (!t.approved) return { text: 'Pendente', cls: 'badge--inactive' };
    return { text: 'Reprovado', cls: 'badge--inactive' };
  };

  const actionsFor = (t) => {
    const viewBtn = `<button class="btn btn--outline btn--sm" onclick="viewTestimonial('${t.id}')">Ver</button>`;
    const approveBtn = `<button class="btn btn--outline btn--sm" onclick="approveTestimonial('${t.id}')">Aprovar</button>`;
    const rejectBtn = `<button class="btn btn--outline btn--sm" onclick="rejectTestimonial('${t.id}')">Reprovar</button>`;
    const deleteBtn = `<button class="btn btn--outline btn--sm" style="border-color:#e55;color:#e55" onclick="deleteTestimonial('${t.id}')">Excluir</button>`;

    if (t.approved && t.active) {
      return [viewBtn, rejectBtn, deleteBtn].join('');
    }
    if (t.approved && !t.active) {
      return [viewBtn, approveBtn, deleteBtn].join('');
    }
    return [approveBtn, rejectBtn, viewBtn, deleteBtn].join('');
  };

  tbody.innerHTML = list.map(t => `
    <tr>
      <td>${esc(t.name)}</td>
      <td>${esc(t.bike_model || '—')}</td>
      <td>${'★'.repeat(t.rating)}</td>
      <td><span class="badge ${statusLabel(t).cls}">${statusLabel(t).text}</span></td>
      <td>${esc(t.source || 'admin')}</td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${actionsFor(t)}
        </div>
      </td>
    </tr>
  `).join('');
}

window.viewTestimonial = async function (id) {
  const { data, error } = await sb.from('bfr_testimonials').select('*').eq('id', id).single();
  if (error || !data) { showToast('Erro ao carregar depoimento.', 'error'); return; }

  const status = data.approved && data.active ? 'Aprovado' : data.approved ? 'Reprovado' : 'Pendente';
  openModal(
    `Depoimento — ${data.name}`,
    `Bike: ${data.bike_model || '—'}\nNota: ${data.rating}\nStatus: ${status}\n\n${data.text}`,
    null
  );
};

window.approveTestimonial = async function (id) {
  const { error } = await sb.from('bfr_testimonials').update({ approved: true, active: true }).eq('id', id);
  if (error) { showToast('Erro ao aprovar.', 'error'); return; }
  showToast('Depoimento aprovado!');
  loadTestimonials();
};

window.rejectTestimonial = async function (id) {
  const { error } = await sb.from('bfr_testimonials').update({ approved: true, active: false }).eq('id', id);
  if (error) { showToast('Erro ao reprovar.', 'error'); return; }
  showToast('Depoimento reprovado.');
  loadTestimonials();
};

window.deleteTestimonial = function (id) {
  openModal('Excluir depoimento', 'Esta ação não pode ser desfeita. Deseja excluir este depoimento?', async () => {
    const { error } = await sb.from('bfr_testimonials').delete().eq('id', id);
    if (error) { showToast('Erro ao excluir.', 'error'); return; }
    showToast('Depoimento excluído!');
    loadTestimonials();
  });
};

function initTestimonialShareTools() {
  const url = getTestimonialPageUrl();
  const linkInput = document.getElementById('testimonial-link');
  const qrImg = document.getElementById('testimonial-qr');
  const copyBtn = document.getElementById('copy-testimonial-link');

  if (linkInput) linkInput.value = url;
  if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;

  if (copyBtn && !copyBtn._initialized) {
    copyBtn._initialized = true;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado!');
      } catch {
        showToast('Nao foi possivel copiar automaticamente.', 'error');
      }
    });
  }
}

function updateTestimonialMetrics(list) {
  const approved = list.filter(t => t.active && t.approved);
  const metricsEl = document.getElementById('testimonial-metrics');
  if (!metricsEl) return;

  if (!approved.length) {
    metricsEl.textContent = 'Sem avaliacoes aprovadas ainda.';
    return;
  }
  const avg = approved.reduce((sum, t) => sum + Number(t.rating || 0), 0) / approved.length;
  metricsEl.textContent = `Media de nota: ${avg.toFixed(1)} / 5 (${approved.length} aprovados)`;
}

function getTestimonialPageUrl() {
  const base = window.location.origin;
  return `${base}/depoimento`;
}

// ============================================================
// FAQ
// ============================================================
let editingFaqId = null;

async function loadFAQ() {
  const { data, error } = await sb
    .from('bfr_faq')
    .select('*')
    .order('order', { ascending: true });

  if (error) { showToast('Erro ao carregar FAQ.', 'error'); return; }
  renderFAQ(data || []);
  initFAQForm();
}

function renderFAQ(list) {
  const tbody = document.getElementById('faq-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--admin-text-muted)">Nenhuma pergunta cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => `
    <tr>
      <td style="max-width:200px">${esc(f.category || '—')}</td>
      <td style="max-width:360px">${esc(f.question)}</td>
      <td><span class="badge ${f.active ? 'badge--active' : 'badge--inactive'}">${f.active ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn--outline btn--sm" onclick="editFaq('${f.id}')">Editar</button>
          <button class="btn btn--outline btn--sm" onclick="toggleFaq('${f.id}', ${f.active})">${f.active ? 'Desativar' : 'Ativar'}</button>
          <button class="btn btn--outline btn--sm" style="border-color:#e55;color:#e55" onclick="deleteFaq('${f.id}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initFAQForm() {
  const form = document.getElementById('faq-form');
  if (!form || form._initialized) return;
  form._initialized = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      category: document.getElementById('faq-category').value.trim(),
      question: document.getElementById('faq-question').value.trim(),
      answer:   document.getElementById('faq-answer').value.trim(),
    };

    if (!payload.question || !payload.answer) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    let error;
    if (editingFaqId) {
      ({ error } = await sb.from('bfr_faq').update(payload).eq('id', editingFaqId));
    } else {
      const { data: existing } = await sb.from('bfr_faq').select('order').order('order', { ascending: false }).limit(1);
      payload.order = (existing?.[0]?.order ?? -1) + 1;
      ({ error } = await sb.from('bfr_faq').insert([payload]));
    }

    if (error) { showToast('Erro ao salvar pergunta.', 'error'); return; }
    showToast('Pergunta salva!');
    resetFAQForm();
    loadFAQ();
  });

  document.getElementById('faq-cancel')?.addEventListener('click', resetFAQForm);
}

function resetFAQForm() {
  editingFaqId = null;
  document.getElementById('faq-form')?.reset();
  document.getElementById('faq-form-title').textContent = 'Adicionar Pergunta';
  document.getElementById('faq-cancel').style.display = 'none';
}

window.editFaq = async function (id) {
  const { data, error } = await sb.from('bfr_faq').select('*').eq('id', id).single();
  if (error || !data) { showToast('Erro ao carregar pergunta.', 'error'); return; }

  editingFaqId = id;
  document.getElementById('faq-category').value = data.category || '';
  document.getElementById('faq-question').value = data.question;
  document.getElementById('faq-answer').value   = data.answer;
  document.getElementById('faq-form-title').textContent = 'Editar Pergunta';
  document.getElementById('faq-cancel').style.display   = 'inline-flex';
  document.getElementById('faq-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleFaq = async function (id, current) {
  const { error } = await sb.from('bfr_faq').update({ active: !current }).eq('id', id);
  if (error) { showToast('Erro ao atualizar.', 'error'); return; }
  showToast(`Pergunta ${current ? 'desativada' : 'ativada'}!`);
  loadFAQ();
};

window.deleteFaq = function (id) {
  openModal('Excluir pergunta', 'Deseja excluir esta pergunta do FAQ?', async () => {
    const { error } = await sb.from('bfr_faq').delete().eq('id', id);
    if (error) { showToast('Erro ao excluir.', 'error'); return; }
    showToast('Pergunta excluída!');
    loadFAQ();
  });
};

// ============================================================
// CONTEÚDO DA LP
// ============================================================
async function loadContent() {
  const { data, error } = await sb.from('bfr_content').select('key, value');
  if (error || !data) { showToast('Erro ao carregar conteúdo.', 'error'); return; }

  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  document.querySelectorAll('#content-form [data-key]').forEach(el => {
    if (map[el.dataset.key] !== undefined) el.value = map[el.dataset.key];
  });

  initContentForm();
}

function initContentForm() {
  const form = document.getElementById('content-form');
  if (!form || form._initialized) return;
  form._initialized = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = form.querySelectorAll('[data-key]');
    const upserts = Array.from(fields).map(el => ({
      key:        el.dataset.key,
      value:      el.value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await sb.from('bfr_content').upsert(upserts, { onConflict: 'key' });
    if (error) { showToast('Erro ao salvar textos.', 'error'); return; }
    showToast('Textos salvos! As mudanças já estão na LP.');
  });
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
async function loadSettings() {
  const { data, error } = await sb.from('bfr_settings').select('key, value');
  if (error || !data) { showToast('Erro ao carregar configurações.', 'error'); return; }

  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  document.querySelectorAll('#settings-form [data-key]').forEach(el => {
    if (map[el.dataset.key] !== undefined) el.value = map[el.dataset.key];
  });

  initSettingsForm();
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form || form._initialized) return;
  form._initialized = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = form.querySelectorAll('[data-key]');
    const upserts = Array.from(fields).map(el => ({
      key:   el.dataset.key,
      value: el.value,
    }));

    const { error } = await sb.from('bfr_settings').upsert(upserts, { onConflict: 'key' });
    if (error) { showToast('Erro ao salvar configurações.', 'error'); return; }
    showToast('Configurações salvas!');
  });
}

// ============================================================
// MODAL DE CONFIRMAÇÃO
// ============================================================
let modalCallback = null;

function initModal() {
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('confirm-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modal-confirm')?.addEventListener('click', async () => {
    if (modalCallback) await modalCallback();
    closeModal();
  });
}

function openModal(title, text, callback) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-text').textContent  = text;
  document.getElementById('confirm-modal').classList.add('open');
  // Hide confirm button if no callback (info modal)
  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.style.display = callback ? '' : 'none';
  modalCallback = callback;
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('open');
  modalCallback = null;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('admin-toast');
  toast.className = `toast toast--${type} show`;
  toast.querySelector('.toast__icon').textContent = type === 'success' ? '✓' : '✕';
  toast.querySelector('.toast__msg').textContent  = msg;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
