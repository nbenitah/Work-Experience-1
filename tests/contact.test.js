const assert = require('node:assert/strict');
const { test, mock } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('contact endpoint rejects spam and delivers valid submissions', async (t) => {
  const support = require('../server/support');
  const send = mock.method(support, 'sendToSupport', () => {});
  const app = require('../server/index');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => {
    server.close();
    send.mock.restore();
  });

  const url = `http://127.0.0.1:${server.address().port}/contact`;
  const body = { name: 'Test', email: 'test@example.com', message: 'Hello', website: '', form_loaded_at: String(Date.now() - 5000) };
  async function submit(overrides) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, ...overrides }),
    });
    return { status: response.status, body: await response.json() };
  }

  for (const overrides of [
    { website: 'spam' },
    { website: null },
    { form_loaded_at: String(Date.now()) },
    { form_loaded_at: '' },
    { form_loaded_at: 'invalid' },
    { form_loaded_at: String(Date.now() + 5000) },
    { message: '' },
  ]) {
    const result = await submit(overrides);
    assert.equal(result.status, 400);
    assert.equal(result.body.ok, false);
    assert.equal(send.mock.callCount(), 0);
  }
  const valid = await submit({});
  assert.equal(valid.status, 200);
  assert.equal(valid.body.ok, true);
  assert.equal(send.mock.callCount(), 1);
  assert.deepEqual(send.mock.calls[0].arguments[0], { name: 'Test', email: 'test@example.com', message: 'Hello' });
});

test('form timestamp changes on load, successful reset and page restore', async () => {
  let now = 100000;
  let submit;
  let pageshow;
  let sent;
  let response = { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true }) };
  const timestamp = { value: '' };
  const button = { disabled: false };
  const status = { textContent: '', className: '', classList: { add() {} } };
  const form = {
    addEventListener(event, handler) { submit = handler; },
    querySelector() { return button; },
    reset() { timestamp.value = ''; },
  };
  const context = {
    document: { getElementById(id) { return { 'contact-form': form, 'form-status': status, form_loaded_at: timestamp }[id]; } },
    window: { addEventListener(event, handler) { pageshow = handler; } },
    Date: { now: () => now },
    FormData: class { *[Symbol.iterator]() { yield ['form_loaded_at', timestamp.value]; } },
    fetch: async (url, options) => {
      sent = JSON.parse(options.body);
      return response;
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/contact.js'), 'utf8'), context);
  assert.equal(timestamp.value, '100000');
  now = 104000;
  await submit({ preventDefault() {} });
  assert.equal(sent.form_loaded_at, '100000');
  assert.equal(timestamp.value, '104000');
  now = 109000;
  pageshow({ persisted: true });
  assert.equal(timestamp.value, '109000');
  response = { ok: false, headers: { get: () => null } };
  await submit({ preventDefault() {} });
  assert.match(status.textContent, /contact server did not respond correctly/);
  assert.equal(button.disabled, false);
});
