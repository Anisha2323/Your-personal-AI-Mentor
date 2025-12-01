import { requestMentorResponse, generateFallbackHint, getStoredApiKey } from './ai-client.js';

const form = document.getElementById('mentor-form');
const thread = document.getElementById('mentor-thread');
const loadingRow = document.querySelector('.ypm-loading');
const submitButton = form?.querySelector('.ypm-submit');
const keyWarning = form?.querySelector('.ypm-key-warning');
const statusBadge = document.querySelector('[data-status]');
const closeBtn = document.querySelector('.ypm-close-btn');
const pills = form?.querySelectorAll('.ypm-pill');

init();

function init() {
  form?.addEventListener('submit', handleSubmit);
  closeBtn?.addEventListener('click', () => {
    window.parent?.postMessage({ type: 'YPM_HIDE_PANEL' }, '*');
  });

  pills?.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('ypm-pill-active'));
      pill.classList.add('ypm-pill-active');
    });
  });

  reflectApiKeyStatus();
}

async function reflectApiKeyStatus() {
  const key = await getStoredApiKey();
  if (!key) {
    keyWarning?.removeAttribute('hidden');
    statusBadge.textContent = 'Offline hints';
    statusBadge.style.background = 'rgba(194, 121, 2, 0.18)';
    statusBadge.style.color = '#c27902';
  } else {
    keyWarning?.setAttribute('hidden', 'hidden');
    statusBadge.textContent = 'Live AI hints';
    statusBadge.style.background = 'rgba(28,156,106,0.12)';
    statusBadge.style.color = '#1c9c6a';
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!form) return;

  const formData = new FormData(form);
  const payload = {
    stage: formData.get('stage') || 'approach',
    progress: (formData.get('progress') || '').trim(),
    constraints: (formData.get('constraints') || '').trim(),
    hintDepth: formData.get('hintDepth') || 'nudge'
  };

  if (!payload.progress) {
    return;
  }

  appendMessage('user', formatUserSummary(payload));
  setLoading(true);

  try {
    const answer = await requestMentorResponse(payload);
    appendMessage('mentor', answer);
  } catch (error) {
    const fallback = generateFallbackHint(payload, error);
    appendMessage('mentor', fallback);
  } finally {
    setLoading(false);
    form.reset();
    pills?.forEach((p, index) => p.classList.toggle('ypm-pill-active', index === 0));
  }
}

function setLoading(state) {
  if (!submitButton || !loadingRow) return;
  submitButton.disabled = state;
  loadingRow.hidden = !state;
}

function appendMessage(role, text) {
  const empty = thread?.querySelector('.ypm-empty-state');
  empty?.remove();

  const bubble = document.createElement('article');
  bubble.className = `ypm-message ypm-message-${role}`;
  bubble.textContent = text;
  thread?.appendChild(bubble);
  thread?.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
}

function formatUserSummary({ stage, progress, constraints, hintDepth }) {
  return `Stage: ${stage}\nHint intensity: ${hintDepth}\nSummary: ${progress}\nConstraints: ${constraints || 'not captured yet.'}`;
}
