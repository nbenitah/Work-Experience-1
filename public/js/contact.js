const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const loadedAt = document.getElementById('form_loaded_at');

function startFormTimer() {
  loadedAt.value = Date.now().toString();
}

startFormTimer();
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    startFormTimer();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = '';
  statusEl.className = 'form-status';

  const data = Object.fromEntries(new FormData(form));

  try {
    const response = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error('The contact server did not respond correctly. Please email hello@calicomedia.co instead.');
    }
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Something went wrong.');
    }

    form.reset();
    startFormTimer();
    statusEl.textContent = "Thanks, we'll be in touch within one business day.";
    statusEl.classList.add('form-status--success');
  } catch (error) {
    statusEl.textContent = error instanceof SyntaxError
      ? 'The contact server returned an invalid response. Please email hello@calicomedia.co instead.'
      : error.message || 'Something went wrong. Please email hello@calicomedia.co instead.';
    statusEl.classList.add('form-status--error');
  } finally {
    button.disabled = false;
  }
});
