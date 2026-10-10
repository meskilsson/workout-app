// Run after build: node apps/web/tests/adminBrowserCheck.cjs
// Uses the same installed Edge/CDP approach as browserUiCheck.cjs; no extra dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist'), base = 'http://127.0.0.1:8770';
const userId = '0123456789abcdef01234567', exerciseId = '0123456789abcdef01234568';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer((req, res) => {
  let file = path.join(root, new URL(req.url, base).pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
  res.end(fs.readFileSync(file));
});
let browser, ws;
(async () => {
  await new Promise(resolve => server.listen(8770, '127.0.0.1', resolve));
  browser = spawn(process.env.UI_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=9229', '--user-data-dir=' + path.join(process.env.TEMP, 'workout-admin-check-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 100; i++) { try { tabs = await (await fetch('http://127.0.0.1:9229/json/list')).json(); if (tabs.length) break; } catch {} await wait(100); }
  assert(tabs?.length, 'Browser did not start');
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let sequence = 0, role = null, authDelay = 0, failList = false;
  const pending = new Map(), errors = [], requests = [];
  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { pending.delete(id); reject(Error(method + ' timeout')); }, 10000);
      pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  const exercise = { _id: exerciseId, name: 'Shared bench press', isCustom: false, createdBy: null, primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] };
  ws.addEventListener('message', async event => {
    const packet = JSON.parse(event.data);
    if (packet.id) { const job = pending.get(packet.id); if (job) { pending.delete(packet.id); packet.error ? job.reject(Error(JSON.stringify(packet.error))) : job.resolve(packet.result); } return; }
    if (packet.method === 'Runtime.exceptionThrown') errors.push(packet.params.exceptionDetails);
    if (packet.method !== 'Fetch.requestPaused') return;
    const item = packet.params, url = new URL(item.request.url);
    let payload = {}, status = 200;
    if (item.request.method !== 'OPTIONS') {
      requests.push({ path: url.pathname, method: item.request.method, body: item.request.postData });
      if (url.pathname.endsWith('/auth/me')) { payload = { user: role ? { _id: userId, name: 'Admin', username: 'admin', email: 'admin@example.test', role } : null }; await wait(authDelay); }
      else if (url.pathname.endsWith('/admin/dashboard')) payload = { users: 21, admins: 2, workouts: 35, exercises: 10, sharedExercises: 7, templates: 4, sharedTemplates: 2, drafts: 1 };
      else if (url.pathname.endsWith('/admin/exercises/' + exerciseId)) payload = exercise;
      else if (url.pathname.endsWith('/admin/exercises')) {
        payload = item.request.method === 'GET' ? { items: url.searchParams.get('search') ? [] : [exercise], total: url.searchParams.get('search') ? 0 : 11, page: Number(url.searchParams.get('page') || 1), limit: 10 } : exercise;
        if (failList && item.request.method === 'GET') { status = 503; payload = { message: 'Unable to load exercises' }; }
      } else if (url.pathname.endsWith('/admin/users')) payload = { items: [{ _id: userId, name: 'Admin', username: 'admin', role: 'admin', deletedAt: null }], total: 1, page: 1, limit: 10 };
      else if (url.pathname.endsWith('/admin/templates')) payload = { items: [{ _id: exerciseId, name: 'Shared strength template', isPublic: true, category: 'full_body', exercises: [] }], total: 1, page: 1, limit: 10 };
      else if (url.pathname.endsWith('/admin/sessions')) payload = { items: [{ _id: exerciseId, userId, endedAt: '2026-10-10T10:00:00Z', exercises: [] }], total: 1, page: 1, limit: 10 };
      else if (url.pathname.includes('/admin/')) payload = { items: [], total: 0, page: 1, limit: 10 };
      else if (url.pathname.includes('/workout-drafts')) { status = 404; payload = { message: 'No draft' }; }
      else if (url.pathname.includes('/users/')) payload = { _id: userId, name: 'User', username: 'user', email: 'user@example.test', role };
      else payload = [];
    }
    await send('Fetch.fulfillRequest', { requestId: item.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }], body: Buffer.from(JSON.stringify(payload)).toString('base64') }).catch(() => {});
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;
  }
  async function navigate(route) { await send('Page.navigate', { url: base + route }); await wait(950); }
  async function click(text) { assert(await evaluate(`(() => { const element = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!element) return false; element.click(); return true; })()`), 'Missing button ' + text); await wait(500); }
  await navigate('/admin/exercises'); assert.equal(await evaluate('location.pathname'), '/login');
  role = 'user'; await navigate('/admin'); assert.equal(await evaluate('location.pathname'), '/profile');
  assert.equal(await evaluate(`!!document.querySelector('a[href="/admin"]')`), false);
  role = 'admin'; authDelay = 1500; const before = requests.filter(req => req.path.includes('/admin/')).length;
  await send('Page.navigate', { url: base + '/admin' }); await wait(350);
  assert.equal(await evaluate('document.body.innerText.includes("Admin dashboard")'), false);
  assert.equal(requests.filter(req => req.path.includes('/admin/')).length, before, 'Admin request before auth initialization');
  await wait(1900); authDelay = 0;
  assert(await evaluate('document.body.innerText.includes("Active users") && document.body.innerText.includes("21")'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/admin/exercises');
  assert(await evaluate('document.body.innerText.includes("Shared bench press")'));
  assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Mobile page overflows');
  await click('Details'); assert(await evaluate('document.querySelector("[role=dialog]").innerText.includes("chest")')); await click('Close');
  await click('Edit'); assert(await evaluate('document.querySelector("[role=dialog] input").value === "Shared bench press"')); await click('Cancel');
  await click('Create shared exercise');
  await evaluate(`(() => { const input = document.querySelector('[role=dialog] input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'New shared exercise'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await click('Save'); assert(requests.some(req => req.path.endsWith('/admin/exercises') && req.method === 'POST' && JSON.parse(req.body).name === 'New shared exercise'));
  await click('Delete'); assert(await evaluate('document.querySelector("[role=dialog]").innerText.includes("Referenced exercises")')); await click('Cancel');
  assert(!requests.some(req => req.method === 'DELETE'), 'Cancelled deletion sent a request');
  await click('Next'); assert(requests.some(req => req.path.endsWith('/admin/exercises') && req.method === 'GET')); assert(await evaluate('document.body.innerText.includes("Page 2")'));
  await navigate('/admin/users'); assert(await evaluate('[...document.querySelectorAll("button")].filter(e => ["Demote", "Deactivate"].includes(e.textContent.trim())).every(e => e.disabled)'));
  failList = true; await navigate('/admin/exercises'); assert(await evaluate('document.querySelector("[role=alert]").innerText.includes("Unable to load")'));
  failList = false; await click('Retry'); assert(await evaluate('document.body.innerText.includes("Shared bench press")'));
  for (const mode of ['light','dark']) for (const width of [375,1440]) {
    await evaluate('localStorage.setItem("color_theme",'+JSON.stringify(mode)+')');
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1000 });
    for (const [section, expected] of [['', 'Active users'], ['/users','@admin'], ['/exercises','Shared bench press'], ['/templates','Shared strength template'], ['/sessions','Personal']]) {
      await navigate('/admin'+section);
      assert((await evaluate('document.body.innerText')).includes(expected), section+' missing data');
      assert.equal(await evaluate('document.documentElement.dataset.theme'),mode);
      assert(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),section+' overflows');
    }
    console.log('PASS all admin sections',mode,width);
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log('Admin browser checks passed: guest/user redirects, delayed authentication, real-data rendering, mobile layout, details, edit/create, delete cancellation, pagination, self-change controls, error/retry.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { ws?.close(); browser?.kill(); server.close(); });
