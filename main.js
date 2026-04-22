// ============================================================
// main.js — Interações da Landing Page BikeFit
// ============================================================

import sb from './supabase.js';

const ANALYTICS_SESSION_KEY = 'bikefit_analytics_session_id';
const PAGE_NAME = 'landing';

function getAnalyticsSessionId() {
  const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const created = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  localStorage.setItem(ANALYTICS_SESSION_KEY, created);
  return created;
}

async function trackEvent(eventName, eventMeta = {}) {
  try {
    await sb.from('bfr_analytics_events').insert([{
      event_name: eventName,
      page: PAGE_NAME,
      session_id: getAnalyticsSessionId(),
      event_meta: eventMeta,
    }]);
  } catch (error) {
    console.warn('Falha ao registrar evento de analytics:', error);
  }
}

// ============================================================
// MOCK DATA — fallback quando Supabase está vazio
// ============================================================
const MOCK = {
  content: {
    hero_headline:    'Seu corpo merece<br /><em>a posição certa.</em>',
    hero_subheadline: 'BikeFit profissional e presencial para ciclistas que querem pedalar mais, com menos dor e mais performance.',
    hero_badge:       '✓ Atendimento Presencial · São Paulo, SP',
  },

  settings: {
    whatsapp:  '5511999999999',
    instagram: 'https://instagram.com/',
    strava:    'https://strava.com/',
    youtube:   'https://youtube.com/',
    email:     'contato@ranieldybikefit.com.br',
    address:   'São Paulo, SP',
    city:      'São Paulo',
  },

  testimonials: [
    {
      id: 'mock-1',
      name: 'Carlos M.',
      modality: 'Ciclismo de Estrada',
      text: 'Após o BikeFit resolvi a dor no joelho que me perseguia há meses. Minha posição ficou muito mais eficiente e agora pedalo com prazer novamente.',
      rating: 5,
      photo_url: 'https://i.pravatar.cc/150?img=11',
      active: true,
      order: 1,
    },
    {
      id: 'mock-2',
      name: 'Ana Paula R.',
      modality: 'Triathlon',
      text: 'Profissional incrível! Ajustou minha posição para as três modalidades e meu tempo no ciclismo melhorou significativamente na próxima prova.',
      rating: 5,
      photo_url: 'https://i.pravatar.cc/150?img=47',
      active: true,
      order: 2,
    },
    {
      id: 'mock-3',
      name: 'Diego S.',
      modality: 'MTB',
      text: 'Valia cada centavo. Saí da sessão com a bike completamente regulada e um relatório detalhado de todas as medidas. Super recomendo!',
      rating: 5,
      photo_url: 'https://i.pravatar.cc/150?img=32',
      active: true,
      order: 3,
    },
    {
      id: 'mock-4',
      name: 'Fernanda L.',
      modality: 'Ciclismo Urbano',
      text: 'Comecei a usar a bike para ir trabalhar e estava com dores nas costas toda semana. Depois do BikeFit, zero desconforto. Simplesmente incrível.',
      rating: 5,
      photo_url: 'https://i.pravatar.cc/150?img=44',
      active: true,
      order: 4,
    },
    {
      id: 'mock-5',
      name: 'Rodrigo T.',
      modality: 'Ciclismo de Estrada',
      text: 'Ganhou mais de 15W no meu FTP só com o ajuste de posição. O Ranieldy é extremamente técnico e atencioso. Voltarei para revisão anual com certeza.',
      rating: 5,
      photo_url: 'https://i.pravatar.cc/150?img=68',
      active: true,
      order: 5,
    },
  ],

  faq: [
    { id: 'fq-1', question: 'O que é BikeFit e por que preciso fazer?',          answer: 'BikeFit é a análise e ajuste biomecânico da posição do ciclista na bicicleta. Uma posição correta evita lesões, aumenta o conforto e melhora a performance — independente do nível ou modalidade.', order: 1, active: true },
    { id: 'fq-2', question: 'Quanto tempo dura a sessão?',                        answer: 'Uma sessão completa dura em média 2 a 3 horas. O tempo varia conforme a complexidade dos ajustes e o tipo de avaliação (básica ou avançada).', order: 2, active: true },
    { id: 'fq-3', question: 'Preciso levar minha bicicleta?',                     answer: 'Sim! Traga sua bicicleta, capacete, sapatilha (se usar), kit de ciclismo e qualquer palmilha ortopédica. Quanto mais completo o setup, mais precisos os ajustes.', order: 3, active: true },
    { id: 'fq-4', question: 'O BikeFit serve para qualquer tipo de bicicleta?',   answer: 'Sim. Atendemos ciclistas de estrada, MTB, triathlon/TT e ciclismo urbano. Cada modalidade tem suas especificidades e o ajuste é feito de forma personalizada.', order: 4, active: true },
    { id: 'fq-5', question: 'Qual a diferença entre BikeFit básico e avançado?',  answer: 'O básico cobre ajustes de altura e recuo de selim, alcance e posição dos pedivelas. O avançado inclui análise de movimento em vídeo, análise de força, ajuste de cleats e relatório completo em PDF.', order: 5, active: true },
    { id: 'fq-6', question: 'Vou receber algum documento após a sessão?',         answer: 'Sim! Você recebe um relatório completo em PDF com todas as medidas ajustadas, fotos da posição final e recomendações personalizadas para continuar evoluindo.', order: 6, active: true },
    { id: 'fq-7', question: 'Com que frequência devo refazer o BikeFit?',         answer: 'Recomenda-se revisar a posição anualmente ou sempre que houver mudança significativa: novo equipamento, lesão, perda ou ganho de peso, ou mudança de objetivo.', order: 7, active: true },
    { id: 'fq-8', question: 'Como me preparar para a sessão?',                    answer: 'Chegue descansado, com equipamento completo e, se possível, com fotos ou vídeos de pedais recentes. Evite treinos extenuantes no dia anterior.', order: 8, active: true },
  ],

  // Gera slots realistas para as próximas semanas
  get availabilitySlots() {
    const slots = [];
    const today = new Date();
    // Seg=1, Ter=2, Qua=3, Qui=4, Sex=5, Sab=6
    const schedule = {
      1: ['09:00', '14:00'],
      2: ['09:00', '16:30'],
      3: ['09:00', '11:00', '14:00'],
      4: ['14:00', '16:30'],
      5: ['09:00', '14:00'],
      6: ['09:00', '11:00'],
    };
    for (let i = 2; i <= 50; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dow = d.getDay();
      if (!schedule[dow]) continue;
      const dateStr = d.toISOString().split('T')[0];
      schedule[dow].forEach(time => slots.push({ date: dateStr, time }));
    }
    return slots;
  },
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  trackEvent('page_view');
  initCursor();
  initNavbar();
  initScrollReveal();
  initFAQAccordion();
  initCarousel();
  initCalendar();
  initBookingForm();
  initAnalyticsTracking();

  // Carrega dados dinâmicos do Supabase
  await Promise.all([
    loadContent(),
    loadTestimonials(),
    loadFAQ(),
    loadSettings(),
  ]);

  // Atualiza ícones Lucide após injeção de HTML dinâmico
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Ano atual no footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

function initAnalyticsTracking() {
  document.addEventListener('click', (e) => {
    const emailFab = e.target.closest('#email-fab');
    if (emailFab) {
      trackEvent('email_fab_click');
      return;
    }

    const bookingLink = e.target.closest('a[href="#agendamento"], a[href*="simplesagenda.com.br"]');
    if (!bookingLink) return;

    let source = 'other';
    if (bookingLink.classList.contains('navbar__cta')) source = 'navbar';
    else if (bookingLink.closest('.hero')) source = 'hero';
    else if (bookingLink.classList.contains('booking__cta-btn')) source = 'booking_section';
    else if (bookingLink.closest('.navbar__drawer')) source = 'mobile_menu';

    trackEvent('cta_booking_click', { source });
  });
}

// ============================================================
// CURSOR CUSTOMIZADO
// ============================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  // Só ativa em desktop (pointer: fine)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let ringX = 0, ringY = 0;
  let curX = 0,  curY = 0;
  let raf;

  document.addEventListener('mousemove', e => {
    curX = e.clientX;
    curY = e.clientY;
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
  });

  // Ring segue com lag suave
  function animateRing() {
    ringX += (curX - ringX) * 0.12;
    ringY += (curY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Esconde ao sair da janela
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    ring.style.opacity   = '1';
  });
}

// ============================================================
// NAVBAR — scroll + hamburguer
// ============================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const drawerClose = document.getElementById('drawer-close');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const openDrawer = () => {
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    hamburger?.setAttribute('aria-label', 'Fechar menu');
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
    drawerClose?.focus();
  };

  hamburger?.addEventListener('click', () => {
    if (drawer?.classList.contains('open')) {
      window.closeDrawer(false);
    } else {
      openDrawer();
    }
  });

  drawerClose?.addEventListener('click', () => window.closeDrawer(true));

  overlay?.addEventListener('click', () => window.closeDrawer(true));

  drawer?.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href')?.startsWith('#')) {
      window.closeDrawer(false);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !drawer?.classList.contains('open')) return;
    e.preventDefault();
    window.closeDrawer(true);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && drawer?.classList.contains('open')) {
      window.closeDrawer(false);
    }
  });
}

/**
 * @param {boolean} [focusMenuButton] — devolve foco ao botão hambúrguer (acessibilidade)
 */
window.closeDrawer = function (focusMenuButton = false) {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const hamburger = document.getElementById('hamburger');

  drawer?.classList.remove('open');
  hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  hamburger?.setAttribute('aria-label', 'Abrir menu');
  overlay?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (overlay) overlay.style.display = '';
  }, 350);
  if (focusMenuButton) {
    hamburger?.focus();
  }
};

// ============================================================
// SCROLL REVEAL
// ============================================================
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function initFAQAccordion() {
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.faq-item__trigger');
    if (!trigger) return;
    const item = trigger.closest('.faq-item');
    const isOpen = item.classList.contains('open');

    // Fecha todos
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-item__trigger').setAttribute('aria-expanded', 'false');
    });

    // Abre o clicado se estava fechado
    if (!isOpen) {
      item.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
}

// ============================================================
// CARROSSEL DE DEPOIMENTOS
// ============================================================
let carouselIndex = 0;
let carouselTotal = 0;
let carouselPerView = 3;
let touchStartX = 0;
let carouselData = [];

function initCarousel() {
  document.getElementById('prev-btn')?.addEventListener('click', () => moveCarousel(-1));
  document.getElementById('next-btn')?.addEventListener('click', () => moveCarousel(1));

  const track = document.getElementById('testimonials-track');
  track?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) moveCarousel(dx < 0 ? 1 : -1);
  });
}

function moveCarousel(dir) {
  const maxIndex = Math.max(0, carouselTotal - carouselPerView);
  carouselIndex = Math.min(maxIndex, Math.max(0, carouselIndex + dir));
  updateCarouselPosition();
}

function updateCarouselPosition() {
  const track = document.getElementById('testimonials-track');
  if (!track) return;

  const card = track.querySelector('.testimonial-card');
  if (!card) return;
  const cardW = card.offsetWidth + 24; // gap = 24px

  track.style.transform = `translateX(-${carouselIndex * cardW}px)`;

  // Dots
  document.querySelectorAll('.testimonials__dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === carouselIndex);
    dot.setAttribute('aria-selected', i === carouselIndex ? 'true' : 'false');
  });
}

function updateCarouselPerView() {
  const w = window.innerWidth;
  carouselPerView = w >= 1024 ? 3 : w >= 768 ? 2 : 1;
}

function renderCarousel(testimonials) {
  const track = document.getElementById('testimonials-track');
  const dotsEl = document.getElementById('carousel-dots');
  if (!track || !dotsEl) return;

  carouselData = testimonials;
  carouselTotal = testimonials.length;
  updateCarouselPerView();
  carouselIndex = 0;

  track.innerHTML = testimonials.map(t => {
    const initials = t.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
    const photoEl = t.photo_url
      ? `<img src="${t.photo_url}" alt="Foto de ${t.name}" class="testimonial-card__avatar" loading="lazy" />`
      : `<div class="testimonial-card__avatar" aria-hidden="true">${initials}</div>`;
    return `
      <div class="testimonial-card" role="article">
        <div class="testimonial-card__stars" aria-label="${t.rating} de 5 estrelas">${stars}</div>
        <p class="testimonial-card__text">${escapeHtml(t.text)}</p>
        <div class="testimonial-card__author">
          ${photoEl}
          <div>
            <div class="testimonial-card__name">${escapeHtml(t.name)}</div>
            <div class="testimonial-card__modality">${escapeHtml(t.modality)}</div>
            ${t.bike_model ? `<div class="testimonial-card__modality">${escapeHtml(t.bike_model)}</div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  const maxDots = Math.max(1, carouselTotal - carouselPerView + 1);
  dotsEl.innerHTML = Array.from({ length: maxDots }, (_, i) =>
    `<button class="testimonials__dot${i === 0 ? ' active' : ''}" role="tab" aria-label="Depoimento ${i + 1}" aria-selected="${i === 0}"></button>`
  ).join('');

  dotsEl.querySelectorAll('.testimonials__dot').forEach((dot, i) => {
    dot.addEventListener('click', () => { carouselIndex = i; updateCarouselPosition(); });
  });

  window.addEventListener('resize', () => {
    updateCarouselPerView();
    carouselIndex = 0;
    updateCarouselPosition();
  }, { passive: true });

  updateCarouselPosition();
}

// ============================================================
// CALENDÁRIO DE AGENDAMENTO
// ============================================================
let selectedDate = null;
let selectedTime = null;
let availableSlots = []; // { date: 'YYYY-MM-DD', time: 'HH:MM' }
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function initCalendar() {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });
}

async function loadAvailableSlots() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('bfr_availability_slots')
    .select('date, time')
    .eq('active', true)
    .gte('date', today);

  availableSlots = data?.length ? data : MOCK.availabilitySlots;
  renderCalendar();
}

function renderCalendar() {
  const grid  = document.getElementById('calendar-grid');
  const label = document.getElementById('cal-month-label');
  if (!grid || !label) return;

  label.textContent = `${MONTHS_PT[calendarMonth]} ${calendarYear}`;

  const firstDay   = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const today      = new Date();
  today.setHours(0, 0, 0, 0);

  // Datas com slots disponíveis neste mês
  const availDates = new Set(
    availableSlots
      .filter(s => {
        const d = new Date(s.date + 'T00:00:00');
        return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
      })
      .map(s => s.date)
  );

  let html = '';

  // Células vazias antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="date-cell empty" aria-hidden="true"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${calendarYear}-${String(calendarMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dateObj  = new Date(dateStr + 'T00:00:00');
    const isPast   = dateObj < today;
    const hasSlots = availDates.has(dateStr);
    const isToday  = dateObj.toDateString() === today.toDateString();
    const isSelected = dateStr === selectedDate;

    let cls = 'date-cell';
    if (isPast || !hasSlots) cls += ' disabled';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';

    const label = `${d} de ${MONTHS_PT[calendarMonth]}${isToday ? ' (hoje)' : ''}`;
    html += `<div class="${cls}" data-date="${dateStr}" role="gridcell" tabindex="${isPast || !hasSlots ? '-1' : '0'}" aria-label="${label}" aria-selected="${isSelected}">${d}</div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.date-cell:not(.disabled):not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => selectDate(cell.dataset.date));
    cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectDate(cell.dataset.date); });
  });
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  selectedTime = null;
  renderCalendar();
  renderTimeSlots(dateStr);
  clearFieldError('err-date');
}

function renderTimeSlots(dateStr) {
  const container = document.getElementById('time-slots');
  if (!container) return;

  const slots = availableSlots
    .filter(s => s.date === dateStr)
    .map(s => s.time.slice(0, 5))
    .sort();

  if (!slots.length) {
    container.innerHTML = `<span style="color:var(--color-text-muted);font-size:0.85rem">Nenhum horário disponível neste dia.</span>`;
    return;
  }

  container.innerHTML = slots.map(t =>
    `<button type="button" class="time-slot${t === selectedTime ? ' selected' : ''}" data-time="${t}" aria-pressed="${t === selectedTime}">${t}</button>`
  ).join('');

  container.querySelectorAll('.time-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTime = btn.dataset.time;
      container.querySelectorAll('.time-slot').forEach(b => {
        b.classList.toggle('selected', b.dataset.time === selectedTime);
        b.setAttribute('aria-pressed', b.dataset.time === selectedTime);
      });
      clearFieldError('err-time');
    });
  });
}

// ============================================================
// FORMULÁRIO DE AGENDAMENTO
// ============================================================
function initBookingForm() {
  const form = document.getElementById('booking-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const booking = {
      name:     document.getElementById('b-name').value.trim(),
      email:    document.getElementById('b-email').value.trim(),
      phone:    document.getElementById('b-phone').value.trim(),
      modality: document.getElementById('b-modality').value,
      date:     selectedDate,
      time:     selectedTime + ':00',
      notes:    document.getElementById('b-notes').value.trim() || null,
      status:   'pendente',
    };

    const { error } = await sb.from('bookings').insert([booking]);

    if (error) {
      console.error('Erro ao registrar agendamento:', error);
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="calendar-check" aria-hidden="true"></i> Confirmar Agendamento';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      showToast('Erro ao enviar. Tente novamente.', 'error');
      return;
    }

    form.style.display = 'none';
    document.getElementById('booking-success').classList.add('visible');
  });
}

function validateForm() {
  let valid = true;

  const name     = document.getElementById('b-name').value.trim();
  const email    = document.getElementById('b-email').value.trim();
  const phone    = document.getElementById('b-phone').value.trim();
  const modality = document.getElementById('b-modality').value;

  if (!name)                          { showFieldError('b-name',     'err-name');     valid = false; }
  if (!email || !isValidEmail(email)) { showFieldError('b-email',    'err-email');    valid = false; }
  if (!phone)                         { showFieldError('b-phone',    'err-phone');    valid = false; }
  if (!modality)                      { showFieldError('b-modality', 'err-modality'); valid = false; }
  if (!selectedDate)                  { showError('err-date'); valid = false; }
  if (!selectedTime)                  { showError('err-time'); valid = false; }

  return valid;
}

function showFieldError(fieldId, errId) {
  document.getElementById(fieldId)?.classList.add('error');
  showError(errId);
}

function showError(errId) {
  document.getElementById(errId)?.classList.add('visible');
}

function clearFieldError(errId) {
  document.getElementById(errId)?.classList.remove('visible');
}

// Limpa erros ao digitar
['b-name','b-email','b-phone','b-modality'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById(id)?.classList.remove('error');
  });
});

window.resetBookingForm = function (e) {
  e?.preventDefault();
  const form = document.getElementById('booking-form');
  const success = document.getElementById('booking-success');
  form.reset();
  form.style.display = '';
  success.classList.remove('visible');
  selectedDate = null;
  selectedTime = null;
  renderCalendar();
  const timeSlots = document.getElementById('time-slots');
  if (timeSlots) timeSlots.innerHTML = `<span style="color:var(--color-text-muted);font-size:0.85rem">Selecione uma data primeiro.</span>`;
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// CARREGAMENTO DE DADOS SUPABASE
// ============================================================

async function loadContent() {
  const { data } = await sb.from('bfr_content').select('key, value');
  const map = data?.length
    ? Object.fromEntries(data.map(r => [r.key, r.value]))
    : MOCK.content;

  const badgeEl = document.getElementById('hero-badge');
  if (badgeEl && map.hero_badge) badgeEl.textContent = map.hero_badge;

  const headlineEl = document.getElementById('hero-headline');
  if (headlineEl && map.hero_headline) headlineEl.innerHTML = map.hero_headline;

  const subEl = document.getElementById('hero-subheadline');
  if (subEl && map.hero_subheadline) subEl.textContent = map.hero_subheadline;
}

async function loadTestimonials() {
  const { data } = await sb
    .from('bfr_testimonials')
    .select('*')
    .eq('active', true)
    .eq('approved', true)
    .order('order', { ascending: true });

  renderCarousel(data?.length ? data : MOCK.testimonials);
}

async function loadFAQ() {
  const { data } = await sb
    .from('bfr_faq')
    .select('*')
    .eq('active', true)
    .order('order', { ascending: true });

  const items = data?.length ? data : MOCK.faq;
  if (!items?.length) return;

  const list = document.getElementById('faq-list');
  if (!list) return;

  list.innerHTML = items.map((item, i) => `
    <div class="faq-item reveal" role="listitem">
      <button class="faq-item__trigger" aria-expanded="false" aria-controls="faq-body-${i}" id="faq-trigger-${i}">
        <span>${escapeHtml(item.question)}</span>
        <span class="faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div class="faq-item__body" id="faq-body-${i}" role="region" aria-labelledby="faq-trigger-${i}">
        <p class="faq-item__answer">${escapeHtml(item.answer)}</p>
      </div>
    </div>
  `).join('');

  // Dispara scroll reveal para os novos elementos
  initScrollReveal();
  await loadAvailableSlots();
}

async function loadSettings() {
  const { data } = await sb.from('bfr_settings').select('key, value');
  const s = data?.length
    ? Object.fromEntries(data.map(r => [r.key, r.value]))
    : MOCK.settings;

  // Email FAB
  const fab = document.getElementById('email-fab');
  if (fab) {
    const configuredEmail = (s.email || '').trim();
    const targetEmail = configuredEmail || MOCK.settings.email || 'contato@ranieldybikefit.com.br';
    const subject = encodeURIComponent('Contato via site - BikeFit');
    const body = encodeURIComponent('Ola! Gostaria de saber mais sobre o BikeFit.');
    fab.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  }

  // Footer socials
  const socials = document.getElementById('footer-socials');
  if (socials) {
    const links = [
      { key: 'instagram', label: 'Instagram', icon: '📸' },
      { key: 'strava',    label: 'Strava',    icon: '🚴' },
      { key: 'youtube',   label: 'YouTube',   icon: '▶' },
    ];
    socials.innerHTML = links
      .filter(l => s[l.key] && s[l.key] !== 'https://instagram.com/' && s[l.key].length > 10)
      .map(l => `<a href="${s[l.key]}" class="footer__social" target="_blank" rel="noopener noreferrer" aria-label="${l.label}">${l.icon}</a>`)
      .join('');
  }

  // Footer contact
  const contact = document.getElementById('footer-contact');
  if (contact) {
    contact.innerHTML = `
      ${s.address ? `<div class="footer__contact-item"><span class="footer__contact-icon">📍</span> ${escapeHtml(s.address)}</div>` : ''}
      ${s.email   ? `<div class="footer__contact-item"><span class="footer__contact-icon">✉️</span> <a href="mailto:${escapeHtml(s.email)}">${escapeHtml(s.email)}</a></div>` : ''}
      ${s.whatsapp ? `<div class="footer__contact-item"><span class="footer__contact-icon">📱</span> <a href="https://wa.me/${s.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>` : ''}
    `;
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast__icon"></span><span class="toast__msg"></span>`;
    document.body.appendChild(toast);
  }
  toast.className = `toast toast--${type}`;
  toast.querySelector('.toast__icon').textContent = type === 'success' ? '✓' : '✕';
  toast.querySelector('.toast__msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
