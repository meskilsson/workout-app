const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.EXPO_PUBLIC_API_URL = 'http://native-api.test';
const { recoverDraft, notificationWindow, NotificationCoordinator } = require('../src/state/recovery.ts');
const { firstInvalidSet } = require('../src/state/setValidation.ts');
const { setLanguage, label, errorLabel, exerciseName, t } = require('../src/i18n.ts');
const { apiFetch, ApiError, setTokenRenewal, setUnauthorizedHandler } = require('../src/services/apiClient.ts');
const { createCardioTimer, cardioTimerAction, reconcileCardioTimer, cardioEvents, latestFreshEvent } = require('../../../packages/shared/src/index.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; setTokenRenewal(); setUnauthorizedHandler(); });
const draft = { _id: 'draft', userId: 'alice', status: 'active', exercises: [{ exerciseId: 'lift', sets: [{ id: 'set', weight: 10, reps: 8 }] }] };
test('recovery is account/draft scoped and discards ended or stale completion identities', () => {
  const local = { draft: { ...draft, exercises: [{ exerciseId: 'lift', sets: [{ id: 'set', weight: '12.5', reps: '9' }] }] }, completed: { set: true, removed: true }, cardio: {} };
  assert.equal(recoverDraft(local, draft, 'bob'), null);
  assert.equal(recoverDraft(local, { ...draft, status: 'completed' }, 'alice'), null);
  const result = recoverDraft(local, draft, 'alice');
  assert.equal(result.draft.exercises[0].sets[0].weight, '12.5');
  assert.deepEqual(result.completed, { set: true });
  assert.equal(recoverDraft(local, { ...draft, _id: 'new' }, 'alice').draft.exercises[0].sets[0].weight, 10);
});
test('corrupt cardio snapshots cannot fabricate a completed activity', () => {
  const config = { format: 'intervals', rounds: 2, workSeconds: 10, restSeconds: 5 };
  const remote = { ...draft, exercises: [{ exerciseId: 'cardio', training: config, sets: [] }] };
  const saved = { draft: remote, cardio: { cardio: { config, runId: 'run', state: { status: 'completed', elapsedMs: 25000, startedAt: null, manual: false } } } };
  assert.ok(recoverDraft(saved, remote, 'alice').cardio.cardio);
  saved.cardio.cardio.state.elapsedMs = 24000;
  assert.deepEqual(recoverDraft(saved, remote, 'alice').cardio, {});
});
test('native interval rendering and alert events share timestamps and skip stale foreground sounds', () => {
  const config = { format: 'intervals', rounds: 3, workSeconds: 10, restSeconds: 5 };
  let state = cardioTimerAction(createCardioTimer(), config, 'start', 1000);
  const events = cardioEvents('run', state, config, 'cardio');
  assert.deepEqual(events.map(e => e.at), [11000, 16000, 26000, 31000, 41000]);
  assert.equal(latestFreshEvent(events, 1000, 30000), undefined);
  state = cardioTimerAction(state, config, 'pause', 17000);
  state = cardioTimerAction(state, config, 'resume', 25000);
  assert.equal(reconcileCardioTimer(state, config, 60000).status, 'completed');
});
test('notification budget retains final completion and cancellation invalidates in-flight scheduling', async () => {
  const events = Array.from({ length: 199 }, (_, i) => ({ id: `${i}`, at: 1000 + i, cue: 'rest-end' }));
  const window = notificationWindow(events, 999);
  assert.equal(window.length, 60); assert.equal(window.at(-1).id, '198');
  let release; const calls = [];
  const queue = new NotificationCoordinator({ cancel: async () => calls.push('cancel'), schedule: async e => { calls.push(e.id); await new Promise(resolve => { release = resolve; }); } });
  const first = queue.replace(events.slice(0, 2));
  await new Promise(resolve => setImmediate(resolve));
  const cancelled = queue.cancel(); release(); await first; await cancelled;
  assert.deepEqual(calls, ['cancel', '0', 'cancel']);
});
test('concurrent native access expiry renews once and replays each request with bearer auth', async () => {
  let renewals = 0; const headers = [];
  setTokenRenewal(async () => { renewals++; await new Promise(resolve => setImmediate(resolve)); return 'new'; });
  global.fetch = async (_, options) => { headers.push(options.headers.Authorization); assert.equal(options.credentials, 'omit'); return options.headers.Authorization === 'Bearer old' ? new Response(JSON.stringify({ code: 'ACCESS_TOKEN_EXPIRED', message: 'Unauthorized' }), { status: 401 }) : Response.json({ saved: true }); };
  assert.deepEqual(await Promise.all([apiFetch('/one', { token: 'old' }), apiFetch('/two', { token: 'old' })]), [{ saved: true }, { saved: true }]);
  assert.equal(renewals, 1); assert.equal(headers.filter(h => h === 'Bearer new').length, 2);
});
test('temporary renewal/API failures preserve session and field errors without retrying mutations', async () => {
  let expired = 0, calls = 0;
  setUnauthorizedHandler(() => expired++); setTokenRenewal(async () => { throw new ApiError('Unavailable', 503); });
  global.fetch = async () => { calls++; return new Response(JSON.stringify({ code: 'ACCESS_TOKEN_EXPIRED' }), { status: 401 }); };
  await assert.rejects(apiFetch('/one', { token: 'old', method: 'PATCH' }), /Unavailable/);
  assert.equal(expired, 0); assert.equal(calls, 1);
  global.fetch = async () => new Response(JSON.stringify({ message: 'Validation error', errors: [{ field: 'email', message: 'Invalid email' }] }), { status: 400 });
  await assert.rejects(apiFetch('/one'), e => e.fields.email === 'Invalid email');
  global.fetch = async () => new Response('<html>server error</html>', { status: 502 });
  await assert.rejects(apiFetch('/one'), e => e.status === 502 && !e.message.includes('html'));
  global.fetch = async () => new Response('<html>not JSON</html>', { status: 200 });
  await assert.rejects(apiFetch('/one'), e => e instanceof ApiError && !e.message.includes('html'));
});

test('set validation accepts draft blanks and decimal weights, identifies the first invalid reps field', () => {
  assert.equal(firstInvalidSet({ ...draft, exercises: [{ exerciseId: 'lift', sets: [{ weight: '', reps: null }, { weight: '12.5', reps: '8' }] }] }), null);
  assert.equal(firstInvalidSet({ ...draft, exercises: [{ exerciseId: 'lift', sets: [{ weight: 0, reps: '1.5' }] }] }).id, 'lift:0:reps');
  assert.equal(firstInvalidSet({ ...draft, exercises: [{ exerciseId: 'lift', sets: [{ weight: -1, reps: 8 }] }] }).id, 'lift:0:weight');
});

test('late expired responses reuse rotation and retry an API operation at most once', async () => {
  let renewals = 0, calls = 0;
  setTokenRenewal(async () => { renewals++; return 'new'; });
  global.fetch = async (_, options) => { calls++; return options.headers.Authorization === 'Bearer old' ? new Response(JSON.stringify({ code: 'ACCESS_TOKEN_EXPIRED' }), { status: 401 }) : Response.json({ ok: true }); };
  await apiFetch('/one', { token: 'old' }); await apiFetch('/two', { token: 'old' });
  assert.equal(renewals, 1); assert.equal(calls, 4);
  setTokenRenewal(async () => { renewals++; return 'newer'; }); calls = 0;
  global.fetch = async () => { calls++; return new Response(JSON.stringify({ code: 'ACCESS_TOKEN_EXPIRED' }), { status: 401 }); };
  await assert.rejects(apiFetch('/mutation', { token: 'old', method: 'PATCH' }), e => e.status === 401);
  assert.equal(calls, 2);
});

test('Swedish validation stays specific after translation and custom exercise content remains canonical', () => {
  setLanguage('sv');
  assert.equal(label('Exercise library'), 'Övningsbibliotek');
  const message = t('formValidation.useAtLeastValueCharacters', { value0: 8 });
  assert.equal(errorLabel(message), message);
  assert.equal(exerciseName({ name: 'Back', isCustom: true, translations: { sv: { name: 'Rygg' } } }), 'Back');
  assert.equal(exerciseName({ name: 'Bench press', isCustom: false, translations: { sv: { name: 'Bänkpress' } } }), 'Bänkpress');
  setLanguage('en');
});
