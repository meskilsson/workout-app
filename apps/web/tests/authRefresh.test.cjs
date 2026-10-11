const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { apiFetch, setSessionActive, sessionExpiredEvent } = require('../src/utils/apiFetch.ts');
const originalFetch = global.fetch;
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
global.window = new EventTarget();
afterEach(() => { global.fetch = originalFetch; setSessionActive(false); });
const url = 'https://example.test/api/private';
const options = { credentials: 'include' };
test('concurrent 401 responses share one refresh and retry once', async () => {
    let renewals = 0, calls = 0, refreshed = false;
    global.fetch = async address => {
        if (address.endsWith('/refresh')) { renewals++; await new Promise(resolve => setTimeout(resolve, 5)); refreshed = true; return new Response('{}'); }
        if (address.endsWith('/me')) return new Response('', { status: 401 });
        calls++; return new Response('', { status: refreshed ? 200 : 401 });
    };
    const responses = await Promise.all([apiFetch(url, options), apiFetch(url, options)]);
    assert.deepEqual(responses.map(r => r.status), [200, 200]);
    assert.equal(renewals, 1); assert.equal(calls, 4);
});
test('expired refresh notifies an existing session once; guest visits stay silent', async () => {
    let notices = 0;
    const listener = () => notices++;
    window.addEventListener(sessionExpiredEvent, listener);
    global.fetch = async () => new Response('', { status: 401 });
    await apiFetch(url, options); assert.equal(notices, 0);
    setSessionActive(true);
    await apiFetch(url, options); await apiFetch(url, options);
    assert.equal(notices, 1);
    window.removeEventListener(sessionExpiredEvent, listener);
});
test('temporary refresh failure does not announce expiration or retry the mutation', async () => {
    setSessionActive(true); let calls = 0, notices = 0;
    const listener = () => notices++;
    window.addEventListener(sessionExpiredEvent, listener);
    global.fetch = async address => {
        if (address.endsWith('/refresh')) return new Response('', { status: 503 });
        if (address === url) calls++;
        return new Response('', { status: 401 });
    };
    await assert.rejects(apiFetch(url, { ...options, method: 'POST' }));
    assert.equal(calls, 1); assert.equal(notices, 0);
    window.removeEventListener(sessionExpiredEvent, listener);
});
test('login failures never trigger refresh', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; return new Response('', { status: 401 }); };
    assert.equal((await apiFetch('https://example.test/api/auth/login', options)).status, 401);
    assert.equal(calls, 1);
});
