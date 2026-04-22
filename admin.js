// ============================================================
// admin.js — Painel Administrativo BikeFit
// ============================================================

import sb from './supabase.js';

// ============================================================
// INICIALIZAÇÃO — Auth guard
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
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

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display   = 'none';
}

function showApp(email) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display    = 'flex';
  document.getElementById('admin-email-display').textContent = email;
  loadPanel('bookings');
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
  bookings:     'Agendamentos',
  availability: 'Disponibilidade',
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
    case 'bookings':     loadBookings();     break;
    case 'availability': loadSlots();        break;
    case 'testimonials': loadTestimonials(); break;
    case 'faq':          loadFAQ();          break;
    case 'content':      loadContent();      break;
    case 'settings':     loadSettings();     break;
  }
}

// ============================================================
// AGENDAMENTOS
// ============================================================
let allBookings = [];

async function loadBookings() {
  const { data, error } = await sb
    .from('bfr_bookings')
    .select('*')
    .order('date', { ascending: false });

  if (error) { showToast('Erro ao carregar agendamentos.', 'error'); return; }
  allBookings = data || [];
  renderBookings(allBookings);
  initBookingFilters();
  initExportCSV();
}

function renderBookings(list) {
  const tbody = document.getElementById('bookings-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--color-text-muted)">Nenhum agendamento encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td>${esc(b.name)}</td>
      <td><a href="mailto:${esc(b.email)}" style="color:var(--color-primary)">${esc(b.email)}</a></td>
      <td>${esc(b.phone)}</td>
      <td>${esc(b.modality)}</td>
      <td>${formatDate(b.date)}</td>
      <td>${b.time?.slice(0,5) || '—'}</td>
      <td>
        <select class="status-select" data-id="${b.id}" aria-label="Alterar status do agendamento de ${esc(b.name)}" style="background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text);border-radius:4px;padding:4px 8px;font-size:0.8rem">
          <option value="pendente"   ${b.status==='pendente'   ? 'selected':''}>Pendente</option>
          <option value="confirmado" ${b.status==='confirmado' ? 'selected':''}>Confirmado</option>
          <option value="cancelado"  ${b.status==='cancelado'  ? 'selected':''}>Cancelado</option>
        </select>
      </td>
      <td>
        ${b.notes ? `<button class="btn btn--outline btn--sm" onclick="viewNotes('${b.id}')" title="Ver observações">📝</button>` : '—'}
      </td>
    </tr>
  `).join('');

  // Status change handlers
  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const { error } = await sb
        .from('bfr_bookings')
        .update({ status: sel.value })
        .eq('id', sel.dataset.id);
      if (error) { showToast('Erro ao atualizar status.', 'error'); return; }
      showToast('Status atualizado!');
    });
  });
}

function initBookingFilters() {
  const statusSel  = document.getElementById('filter-status');
  const dateSel    = document.getElementById('filter-date');
  const clearBtn   = document.getElementById('filter-clear');

  const applyFilters = () => {
    const status = statusSel?.value;
    const date   = dateSel?.value;
    const filtered = allBookings.filter(b => {
      if (status && b.status !== status) return false;
      if (date   && b.date   !== date)   return false;
      return true;
    });
    renderBookings(filtered);
  };

  statusSel?.addEventListener('change', applyFilters);
  dateSel?.addEventListener('change', applyFilters);
  clearBtn?.addEventListener('click', () => {
    if (statusSel) statusSel.value = '';
    if (dateSel)   dateSel.value   = '';
    renderBookings(allBookings);
  });
}

function initExportCSV() {
  document.getElementById('export-csv')?.addEventListener('click', () => {
    const headers = ['Nome','E-mail','Telefone','Modalidade','Data','Horário','Status','Observações'];
    const rows = allBookings.map(b => [
      b.name, b.email, b.phone, b.modality, b.date, b.time?.slice(0,5), b.status, b.notes || ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `agendamentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

window.viewNotes = function (id) {
  const b = allBookings.find(x => x.id === id);
  if (!b) return;
  openModal(`Observação — ${b.name}`, b.notes || '—', null);
};

// ============================================================
// DISPONIBILIDADE
// ============================================================
let allSlots = [];

async function loadSlots() {
  const { data, error } = await sb
    .from('bfr_availability_slots')
    .select('*')
    .order('date', { ascending: true });

  if (error) { showToast('Erro ao carregar slots.', 'error'); return; }
  allSlots = data || [];
  renderSlots(allSlots);
  initSlotForm();
  initSlotFilter();
}

function renderSlots(list) {
  const container = document.getElementById('slots-list');
  if (!list.length) {
    container.innerHTML = `<p style="color:var(--color-text-muted)">Nenhum slot cadastrado.</p>`;
    return;
  }

  container.innerHTML = list.map(s => `
    <div class="avail-slot-item">
      <div>
        <strong>${formatDate(s.date)}</strong>
        <span style="color:var(--color-text-muted);margin-left:12px">${s.time?.slice(0,5)}</span>
        <span class="badge ${s.active ? 'badge--active' : 'badge--inactive'}" style="margin-left:8px">${s.active ? 'Ativo' : 'Inativo'}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn--outline btn--sm" onclick="toggleSlot('${s.id}', ${s.active})" aria-label="${s.active ? 'Desativar' : 'Ativar'} slot">
          ${s.active ? 'Desativar' : 'Ativar'}
        </button>
        <button class="btn btn--outline btn--sm" style="border-color:#e55;color:#e55" onclick="deleteSlot('${s.id}')" aria-label="Excluir slot">✕</button>
      </div>
    </div>
  `).join('');
}

function initSlotForm() {
  document.getElementById('slot-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const date = document.getElementById('slot-date').value;
    const time = document.getElementById('slot-time').value;
    const max  = parseInt(document.getElementById('slot-max').value) || 1;

    const { error } = await sb.from('bfr_availability_slots').upsert({ date, time, max_bookings: max, active: true }, { onConflict: 'date,time' });
    if (error) { showToast('Erro ao adicionar slot.', 'error'); return; }
    showToast('Slot adicionado!');
    e.target.reset();
    loadSlots();
  });
}

function initSlotFilter() {
  document.getElementById('avail-filter-date')?.addEventListener('change', e => {
    const date = e.target.value;
    renderSlots(date ? allSlots.filter(s => s.date === date) : allSlots);
  });
}

window.toggleSlot = async function (id, currentActive) {
  const { error } = await sb.from('bfr_availability_slots').update({ active: !currentActive }).eq('id', id);
  if (error) { showToast('Erro ao atualizar slot.', 'error'); return; }
  showToast(`Slot ${currentActive ? 'desativado' : 'ativado'}!`);
  loadSlots();
};

window.deleteSlot = function (id) {
  openModal('Excluir slot', 'Tem certeza que deseja excluir este horário?', async () => {
    const { error } = await sb.from('bfr_availability_slots').delete().eq('id', id);
    if (error) { showToast('Erro ao excluir slot.', 'error'); return; }
    showToast('Slot excluído!');
    loadSlots();
  });
};

// ============================================================
// DEPOIMENTOS
// ============================================================
let editingTestimonialId = null;

async function loadTestimonials() {
  const { data, error } = await sb
    .from('bfr_testimonials')
    .select('*')
    .order('order', { ascending: true });

  if (error) { showToast('Erro ao carregar depoimentos.', 'error'); return; }
  renderTestimonials(data || []);
  initTestimonialForm();
}

function renderTestimonials(list) {
  const tbody = document.getElementById('testimonials-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-muted)">Nenhum depoimento cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => `
    <tr>
      <td>${esc(t.name)}</td>
      <td>${esc(t.modality)}</td>
      <td>${'★'.repeat(t.rating)}</td>
      <td><span class="badge ${t.active ? 'badge--active' : 'badge--inactive'}">${t.active ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn--outline btn--sm" onclick="editTestimonial('${t.id}')">Editar</button>
          <button class="btn btn--outline btn--sm" onclick="toggleTestimonial('${t.id}', ${t.active})">${t.active ? 'Desativar' : 'Ativar'}</button>
          <button class="btn btn--outline btn--sm" style="border-color:#e55;color:#e55" onclick="deleteTestimonial('${t.id}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initTestimonialForm() {
  const form = document.getElementById('testimonial-form');
  if (!form || form._initialized) return;
  form._initialized = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value || 5);
    const payload = {
      name:      document.getElementById('t-name').value.trim(),
      modality:  document.getElementById('t-modality').value.trim(),
      text:      document.getElementById('t-text').value.trim(),
      rating,
      photo_url: document.getElementById('t-photo').value.trim() || null,
    };

    if (!payload.name || !payload.modality || !payload.text) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    let error;
    if (editingTestimonialId) {
      ({ error } = await sb.from('bfr_testimonials').update(payload).eq('id', editingTestimonialId));
    } else {
      const { data: existing } = await sb.from('bfr_testimonials').select('order').order('order', { ascending: false }).limit(1);
      payload.order = existing?.[0]?.order + 1 || 0;
      ({ error } = await sb.from('bfr_testimonials').insert([payload]));
    }

    if (error) { showToast('Erro ao salvar depoimento.', 'error'); return; }
    showToast('Depoimento salvo!');
    resetTestimonialForm();
    loadTestimonials();
  });

  document.getElementById('t-cancel')?.addEventListener('click', resetTestimonialForm);
}

function resetTestimonialForm() {
  editingTestimonialId = null;
  document.getElementById('testimonial-form')?.reset();
  document.getElementById('testimonial-form-title').textContent = 'Adicionar Depoimento';
  document.getElementById('t-cancel').style.display = 'none';
}

window.editTestimonial = async function (id) {
  const { data, error } = await sb.from('bfr_testimonials').select('*').eq('id', id).single();
  if (error || !data) { showToast('Erro ao carregar depoimento.', 'error'); return; }

  editingTestimonialId = id;
  document.getElementById('t-name').value     = data.name;
  document.getElementById('t-modality').value = data.modality;
  document.getElementById('t-text').value     = data.text;
  document.getElementById('t-photo').value    = data.photo_url || '';

  const ratingInput = document.querySelector(`input[name="rating"][value="${data.rating}"]`);
  if (ratingInput) ratingInput.checked = true;

  document.getElementById('testimonial-form-title').textContent = 'Editar Depoimento';
  document.getElementById('t-cancel').style.display = 'inline-flex';
  document.getElementById('testimonial-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleTestimonial = async function (id, current) {
  const { error } = await sb.from('bfr_testimonials').update({ active: !current }).eq('id', id);
  if (error) { showToast('Erro ao atualizar.', 'error'); return; }
  showToast(`Depoimento ${current ? 'desativado' : 'ativado'}!`);
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
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:32px;color:var(--color-text-muted)">Nenhuma pergunta cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => `
    <tr>
      <td style="max-width:400px">${esc(f.question)}</td>
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
