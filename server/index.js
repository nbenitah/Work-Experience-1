const path = require('path');
const express = require('express');
const { sendToSupport } = require('./support');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

app.post('/contact', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();
  const website = req.body.website;
  const timestamp = req.body.form_loaded_at;
  const loadedAt = typeof timestamp === 'string' && /^\d+$/.test(timestamp)
    ? Number(timestamp)
    : NaN;
  if (typeof website !== 'string' || website.trim() !== '') {
    return res.status(400).json({ ok: false, error: 'Unable to send this submission. Please email hello@calicomedia.co instead.' });
  }
  if (!Number.isSafeInteger(loadedAt) || loadedAt <= 0 || Date.now() - loadedAt < 3000) {
    return res.status(400).json({ ok: false, error: 'Please wait a few seconds before sending your message.' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Please fill in your name, email and message.' });
  }

  sendToSupport({ name, email, message });
  res.json({ ok: true });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Calico Media site running at http://localhost:${PORT}`);
  });
}

module.exports = app;
