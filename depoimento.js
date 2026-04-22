import sb from './supabase.js';

const STAR_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

document.addEventListener('DOMContentLoaded', () => {
  initForm();
});

function initForm() {
  const form      = document.getElementById('testimonial-public-form');
  const card      = document.getElementById('dep-card');
  const successEl = document.getElementById('dep-success');
  const msg       = document.getElementById('tp-message');
  const submitBtn = document.getElementById('tp-submit');
  const nextBtn   = document.getElementById('tp-next');
  const backBtn   = document.getElementById('tp-back');
  const fill      = document.getElementById('dep-fill');
  const ghost     = document.getElementById('dep-ghost');
  const stepLabel = document.getElementById('dep-step-label');
  const starsHint = document.getElementById('dep-stars-hint');
  const prog      = document.querySelector('.dep-prog');
  const steps     = Array.from(document.querySelectorAll('.dep-step'));

  if (!form || !steps.length) return;

  const totalSteps = steps.length;
  let currentStep  = 1;
  let goingBack    = false;

  // Initialize star hint
  if (starsHint) starsHint.textContent = STAR_LABELS[5];

  // Live star hint update
  document.querySelectorAll('input[name="tp-rating"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (starsHint) starsHint.textContent = STAR_LABELS[parseInt(radio.value, 10)] || '';
    });
  });

  function setStep(step) {
    const prevStep = currentStep;
    currentStep = step;

    steps.forEach(el => {
      const isActive = Number(el.dataset.step) === currentStep;
      el.classList.remove('active', 'dep-step--back');

      if (isActive) {
        if (goingBack) el.classList.add('dep-step--back');
        el.classList.add('active');
      }
    });

    const pct = (currentStep / totalSteps) * 100;
    if (fill) fill.style.width = `${pct}%`;
    if (ghost) ghost.textContent = String(currentStep);
    if (stepLabel) stepLabel.textContent = `Passo ${currentStep} de ${totalSteps}`;
    if (prog) prog.setAttribute('aria-valuenow', currentStep);

    backBtn.style.display   = currentStep > 1 ? '' : 'none';
    nextBtn.style.display   = currentStep < totalSteps ? '' : 'none';
    submitBtn.style.display = currentStep === totalSteps ? '' : 'none';

    // Auto-focus first input in new step
    const activeStep  = steps.find(el => Number(el.dataset.step) === currentStep);
    const focusTarget = activeStep?.querySelector('input:not([type="radio"]), textarea');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
  }

  function validate() {
    if (currentStep === 1) return Boolean(document.getElementById('tp-name')?.value.trim());
    if (currentStep === 2) return Boolean(document.getElementById('tp-bike')?.value.trim());
    if (currentStep === 3) return Boolean(document.querySelector('input[name="tp-rating"]:checked'));
    if (currentStep === 4) return Boolean(document.getElementById('tp-feedback')?.value.trim());
    return true;
  }

  function showError(text) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = '#d94f4f';
  }

  function clearMsg() {
    if (msg) { msg.textContent = ''; msg.style.color = ''; }
  }

  nextBtn.addEventListener('click', () => {
    if (!validate()) { showError('Preencha esta etapa antes de continuar.'); return; }
    clearMsg();
    goingBack = false;
    setStep(Math.min(totalSteps, currentStep + 1));
  });

  backBtn.addEventListener('click', () => {
    clearMsg();
    goingBack = true;
    setStep(Math.max(1, currentStep - 1));
  });

  // Enter key to advance (except textarea)
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (currentStep < totalSteps) nextBtn.click();
      else submitBtn.click();
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name      = document.getElementById('tp-name')?.value.trim();
    const bikeModel = document.getElementById('tp-bike')?.value.trim();
    const feedback  = document.getElementById('tp-feedback')?.value.trim();
    const rating    = parseInt(document.querySelector('input[name="tp-rating"]:checked')?.value || '5', 10);

    if (!name || !bikeModel || !feedback || !rating) {
      showError('Preencha todos os campos obrigatórios.');
      return;
    }

    submitBtn.disabled = true;
    if (msg) { msg.textContent = 'Enviando…'; msg.style.color = 'var(--color-text-muted)'; }

    const { error } = await sb.from('bfr_testimonials').insert([{
      name,
      modality: 'Cliente',
      bike_model: bikeModel,
      text: feedback,
      rating,
      active: true,
      approved: false,
      source: 'public_form',
      submitted_at: new Date().toISOString(),
    }]);

    if (error) {
      showError('Falha ao enviar. Tente novamente.');
      submitBtn.disabled = false;
      return;
    }

    // Show success screen
    if (card)      card.hidden = true;
    if (successEl) successEl.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  setStep(1);
}
