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
  //Spam check: honeypot + timing
  const website = (req.body.website || '').trim();
  const LoadedAt = parseInt(req.body.form_loaded_at, 10);
  const elapsedSeconds = (Date.now() - LoadedAt) / 1000;
  const isHoneypotFilled = website !== '';
  const isTooFast = !LoadedAt || elapsedSeconds < 3;
  if (isHoneypotFilled || isTooFast) {
    //Drop it - do Not call sendToSupport
    // But pretend it worked, so bots think it went through
    return res.json({ ok: true });

  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Please fill in your name, email and message.' });
  }

  sendToSupport({ name, email, message });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Calico Media site running at http://localhost:${PORT}`);
});
