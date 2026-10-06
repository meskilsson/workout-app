import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateKeyPairSync, sign } from 'node:crypto';
import { credentialStore, withAuthLock } from './credentials.mjs';
import { signIn, verifyIdentity, authorizationUrl, validateCallback, requirePlanPermission } from './auth.mjs';
import { createTools } from './tools.mjs';
import { runHarness, chatGPTRequest, readResponseStream } from './harness.mjs';
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'source.ts'), 'const sets = 3;\n');
  return root;
}
test('read tools deny traversal, credentials, symlinks and hidden generated directories', async t => {
  const root = await fixture(t), tools = await createTools(root, 'ask');
  await fs.writeFile(path.join(root, '.env'), 'secret');
  await fs.symlink(root, path.join(root, 'link.ts'), 'junction');
  for (const file of ['../outside', '/etc/passwd', '.env', 'x/../.env', '.git/config', 'link.ts', 'x\\file']) {
    await assert.rejects(tools.execute('read_file', { path: file }));
  }
  assert.equal(await tools.execute('list_files', { directory: '.' }), 'source.ts');
  assert.match(await tools.execute('search_code', { query: 'sets', directory: '.' }), /source.ts:1/);
});
test('read modes enforce permissions even when tool calls are forged', async t => {
  for (const mode of ['ask', 'plan', 'review']) {
    const tools = await createTools(await fixture(t), mode);
    await assert.rejects(tools.execute('replace_text', { path: 'source.ts', old_text: '3', new_text: '4' }));
    await assert.rejects(tools.execute('run_check', { name: 'web:build' }));
  }
});
test('implement requires exact unique replacements and cannot overwrite or modify policy', async t => {
  const root = await fixture(t), tools = await createTools(root, 'implement');
  await tools.execute('replace_text', { path: 'source.ts', old_text: 'sets = 3', new_text: 'sets = 4' });
  assert.match(await fs.readFile(path.join(root, 'source.ts'), 'utf8'), /sets = 4/);
  await assert.rejects(tools.execute('replace_text', { path: 'source.ts', old_text: 'missing', new_text: '' }));
  await tools.execute('create_file', { path: 'new/test.ts', content: 'hello' });
  await assert.rejects(tools.execute('create_file', { path: 'source.ts', content: 'oops' }));
  await assert.rejects(tools.execute('create_file', { path: 'tools/dev-harness/policy.mjs', content: 'oops' }));
  await assert.rejects(tools.execute('create_file', { path: 'AGENTS.md', content: 'oops' }));
  await assert.rejects(tools.execute('run_check', { name: 'web:build' }));
  const enabled = await createTools(root, 'implement', true);
  await assert.rejects(enabled.execute('run_check', { name: 'web:build; echo hacked' }));
  await assert.rejects(enabled.execute('read_file', { path: 'source.ts', extra: 'bad' }));
});
test('tool loop preserves reasoning, handles malformed arguments and returns final text', async () => {
  let round = 0;
  const requests = [], events = [];
  const result = await runHarness({ model: 'test', message: 'task', instructions: 'rules',
    tools: { definitions: [], execute: async () => 'file content' }, log: event => events.push(event),
    request: async body => {
      requests.push(structuredClone(body));
      if (!round++) return { status: 'completed', output: [
        { type: 'reasoning', encrypted_content: 'reason' },
        { type: 'function_call', name: 'read_file', call_id: 'a', arguments: '{bad' },
        { type: 'function_call', name: 'read_file', call_id: 'b', arguments: '{}' },
      ] };
      return { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Done' }] }] };
    },
  });
  assert.equal(result.text, 'Done');
  assert.equal(result.calls, 2);
  assert.equal(events[0].ok, false);
  assert.equal(events[1].ok, true);
  assert.equal(requests[1].input[1].type, 'reasoning');
  assert.equal(requests[1].input[4].call_id, 'a');
});
test('step, call, token and incomplete-response limits stop execution', async () => {
  const base = { model: 'test', message: 'task', instructions: 'rules', tools: { definitions: [], execute: async () => '' } };
  const output = [{ type: 'function_call', call_id: 'a', name: 'x', arguments: '{}' }];
  await assert.rejects(runHarness({ ...base, maxSteps: 1, request: async () => ({ status: 'completed', output }) }), /Step limit/);
  await assert.rejects(runHarness({ ...base, maxCalls: 0, request: async () => ({ status: 'completed', output }) }), /Tool call limit/);
  await assert.rejects(runHarness({ ...base, request: async () => ({ status: 'completed', usage: { total_tokens: 150001 }, output }) }), /token limit/);
  await assert.rejects(runHarness({ ...base, request: async () => ({ status: 'incomplete', output: [] }) }), /incomplete/);
});
function streamEvent(event) {
  return new ReadableStream({ start(controller) {
    const data = new TextEncoder().encode('data: ' + JSON.stringify(event) + '\n\n');
    controller.enqueue(data.slice(0, 12)); controller.enqueue(data.slice(12)); controller.close();
  } });
}
test('plan adapter requires OAuth, streams, namespaces tools and omits unsupported fields', async () => {
  const request = chatGPTRequest({ accessToken: 'oauth-test', expiresAt: Date.now() + 3600000 }, async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer oauth-test');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false); assert.equal(body.stream, true);
    assert.equal(body.tools[0].type, 'namespace');
    assert.equal(body.max_output_tokens, undefined);
    return { ok: true, body: streamEvent({ type: 'response.completed', response: { status: 'completed', output: [{type: 'message', content: [{type: 'output_text', text: 'ok'}]}] } }) };
  });
  assert.equal((await request({ model: 'test', tools: [], max_output_tokens: 6000 })).status, 'completed');
  assert.throws(() => chatGPTRequest({ accessToken: 'sk-key' }), /OAuth/);
  await assert.rejects(chatGPTRequest({ accessToken: 'oauth', expiresAt: 0 })({}), /expired/);
  await assert.rejects(chatGPTRequest({ accessToken: 'oauth', expiresAt: Date.now() + 3600000 }, async () => ({ ok: false, status: 429 }))({ tools: [] }), /No API-key fallback/);
});
test('stream usage-limit errors and interrupted streams are failures', async () => {
  await assert.rejects(readResponseStream(streamEvent({ type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } } })), /usage_limit_exceeded/);
  await assert.rejects(readResponseStream(streamEvent({ type: 'response.output_text.delta', delta: 'partial' })), /without response.completed/);
});
test('OAuth authorization and callbacks enforce PKCE, state and issued client identity', () => {
  const url = new URL(authorizationUrl({ hostId: 'urn:uuid:test', state: 'state', nonce: 'nonce', verifier: 'verifier', redirectUri: 'http://127.0.0.1:1234/auth/callback' }));
  assert.equal(url.searchParams.get('client_id'), 'dynamic_agent_client');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.match(url.searchParams.get('scope'), /chatgpt.tokens.use.direct/);
  const callback = new URL('http://127.0.0.1/auth/callback?state=state&code=code&client_id=oaiapp_test');
  assert.equal(validateCallback(callback, { state: 'state' }).clientId, 'oaiapp_test');
  assert.throws(() => validateCallback(callback, { state: 'bad' }), /state/);
  assert.throws(() => validateCallback(callback, { state: 'state', clientId: 'other' }), /registration/);
  assert.throws(() => requirePlanPermission({ scope: 'openid', access_token: 'oauth', token_type: 'Bearer' }), /not granted/);
});
test('ID token validation checks signature, nonce, issuer, audience and expiry', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test' };
  const claims = { iss: 'https://auth.openai.com', aud: 'client', sub: 'subject', nonce: 'nonce', exp: 2000, iat: 900 };
  function token(overrides = {}) {
    const data = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ ...claims, ...overrides })).toString('base64url');
    return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url');
  }
  const expected = { clientId: 'client', nonce: 'nonce', now: 1000 };
  assert.equal(verifyIdentity(token(), [jwk], expected).sub, 'subject');
  for (const overrides of [{ nonce: 'bad' }, { iss: 'bad' }, { aud: 'bad' }, { exp: 1 }]) assert.throws(() => verifyIdentity(token(overrides), [jwk], expected));
  assert.throws(() => verifyIdentity(token(), [], expected), /signature/);
});
test('CLI implement creates an isolated worktree and captures untracked changes in patch', async t => {
  const { exec } = await import('./tools.mjs');
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'tools'), { recursive: true });
  await fs.cp(new URL('.', import.meta.url), path.join(root, 'tools/dev-harness'), { recursive: true });
  await fs.writeFile(path.join(root, '.gitignore'), '.harness-runs/\n');
  for (const args of [['init'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'initial']]) {
    await exec('git', args, { cwd: root });
  }
  const mock = path.join(root, '.harness-runs/mock.mjs');
  await fs.mkdir(path.dirname(mock), { recursive: true });
  await fs.writeFile(path.join(root, 'tools/dev-harness/auth.mjs'), `export async function signIn() { return {accessToken: 'fake-oauth', expiresAt: Date.now()+3600000}; } export async function signOut() {} export async function listModels() { return [{slug: 'fake', display_name: 'Fake'}]; }`);
  await exec('git', ['add', '.'], { cwd: root });
  await exec('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'test auth stub'], { cwd: root });
  await fs.writeFile(mock, `let round = 0; globalThis.fetch = async () => ({ ok: true, body: new ReadableStream({start(controller) {const response = {status: 'completed', output: round++ ? [{type: 'message', content: [{type: 'output_text', text: 'Done'}]}] : [{type: 'function_call', namespace: 'workout', name: 'create_file', call_id: 'a', arguments: JSON.stringify({path: 'feature.ts', content: 'export const feature = true;\\n'})}]}; controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify({type: 'response.completed', response})+'\\n\\n'));controller.close();}}) });`);
  const result = await exec(process.execPath, ['--import', pathToFileURL(mock).href, 'tools/dev-harness/cli.mjs', '--mode', 'implement', 'add feature'], {
    cwd: root, env: { ...process.env, OPENAI_API_KEY: 'fake', OPENAI_MODEL: 'fake' },
  });
  assert.match(result.stdout, /Isolated worktree/);
  await assert.rejects(fs.stat(path.join(root, 'feature.ts')));
  const runs = (await fs.readdir(path.join(root, '.harness-runs'))).filter(name => name !== 'mock.mjs');
  const report = path.join(root, '.harness-runs', runs[0]);
  assert.match(await fs.readFile(path.join(report, 'changes.patch'), 'utf8'), /\+export const feature = true/);
  assert.equal((await exec('git', ['status', '--porcelain'], { cwd: root })).stdout, '');
  await exec('git', ['worktree', 'remove', '--force', path.join(report, 'worktree')], { cwd: root });
});

test('complete sign-in exchanges the issued client ID and keeps tokens out of registration metadata', async t => {
  const root = await fixture(t);
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let nonce, callbackRequest;
  const session = await signIn({ storageDirectory: root, print: line => {
    if (!line.startsWith('https://')) return;
    const url = new URL(line); nonce = url.searchParams.get('nonce');
    const callback = new URL(url.searchParams.get('redirect_uri'));
    callback.search = new URLSearchParams({ state: url.searchParams.get('state'), client_id: 'oaiapp_test', code: 'test-code' });
    callbackRequest = fetch(callback).then(response => response.text());
  }, fetchImpl: async (url, options) => {
    if (url.endsWith('jwks.json')) return { ok: true, json: async () => ({ keys: [{ ...publicKey.export({format: 'jwk'}), kid: 'test' }] }) };
    assert.equal(options.body.get('client_id'), 'oaiapp_test');
    assert.equal(options.body.get('grant_type'), 'authorization_code');
    const now = Math.floor(Date.now()/1000);
    const data = Buffer.from(JSON.stringify({alg: 'RS256', kid: 'test'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({iss: 'https://auth.openai.com', aud: 'oaiapp_test', sub: 'subject', nonce, iat: now, exp: now+3600})).toString('base64url');
    return { ok: true, json: async () => ({id_token: data+'.'+sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url'), access_token: 'test-oauth-token', refresh_token: 'test-refresh-token', scope: 'chatgpt.tokens.use.direct resource.invoke', token_type: 'Bearer', expires_in: 3600}) };
  } });
  await callbackRequest;
  assert.equal(session.accessToken, 'test-oauth-token');
  const saved = await fs.readFile(path.join(root, 'registration.json'), 'utf8');
  assert.match(saved, /oaiapp_test/);
  assert.doesNotMatch(saved, /test-oauth-token|test-refresh-token|id_token|access_token/);
});

test('stream reconstructs tool calls and messages when completed output is empty', async () => {
  const events = [
    {type: 'response.output_item.added', output_index: 0, item: {type: 'function_call', name: 'read_file', call_id: 'a', arguments: ''}},
    {type: 'response.function_call_arguments.delta', output_index: 0, delta: '{"path":"source.ts"}'},
    {type: 'response.completed', response: {status: 'completed', output: []}},
  ];
  function body(events) { return new ReadableStream({start(controller) { for (const event of events) controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify(event)+'\n\n')); controller.close(); }}); }
  const result = await readResponseStream(body(events));
  assert.equal(result.output[0].arguments, '{"path":"source.ts"}');
  const message = await readResponseStream(body([
    {type: 'response.output_item.done', output_index: 0, item: {type: 'message', content: [{type: 'output_text', text: 'Done'}]}},
    {type: 'response.completed', response: {status: 'completed', output: []}},
  ]));
  assert.equal(message.output[0].content[0].text, 'Done');
  await assert.rejects(readResponseStream(body([{type: 'response.completed', response: {status: 'completed', output: []}}])), /Event types/);
});

test('saved session is reused without any browser or network request', async t => {
  const root = await fixture(t), store = credentialStore(root);
  await fs.writeFile(path.join(root, 'registration.json'), JSON.stringify({hostId: 'host', active: 0, accounts: [{clientId: 'client', subject: 'subject', email: 'test@example.com'}]}));
  await store.save('client', {clientId: 'client', subject: 'subject', access_token: 'oauth-saved', token_type: 'Bearer', scope: 'resource.invoke chatgpt.tokens.use.direct', expiresAt: Date.now()+3600000});
  const session = await signIn({storageDirectory: root, print: () => {}, fetchImpl: async () => { throw Error('No network expected'); }});
  assert.equal(session.accessToken, 'oauth-saved');
});
test('expired session refreshes once, preserves scopes and saves rotated refresh token', async t => {
  const root = await fixture(t), store = credentialStore(root);
  await fs.writeFile(path.join(root, 'registration.json'), JSON.stringify({hostId: 'host', accounts: [{clientId: 'client', subject: 'subject'}]}));
  await store.save('client', {clientId: 'client', subject: 'subject', access_token: 'old-access', refresh_token: 'old-refresh', token_type: 'Bearer', scope: 'resource.invoke chatgpt.tokens.use.direct', expiresAt: 0});
  let calls = 0;
  const session = await signIn({storageDirectory: root, print: () => {}, fetchImpl: async (url, options) => {
    calls++; assert.equal(options.body.get('grant_type'), 'refresh_token');
    assert.equal(options.body.get('client_id'), 'client');
    assert.equal(options.body.get('refresh_token'), 'old-refresh');
    assert.equal(options.body.has('scope'), false);
    return {ok: true, json: async () => ({access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600, token_type: 'Bearer'})};
  }});
  assert.equal(calls, 1); assert.equal(session.accessToken, 'new-access');
  assert.equal((await store.load('client')).refresh_token, 'new-refresh');
});
test('Windows credential format encrypts payload and fails closed on protection errors', async t => {
  const root = await fixture(t);
  const protect = async (value, decrypt) => decrypt ? value.slice(7) : 'sealed:'+value;
  const store = credentialStore(root, {platform: 'win32', protect});
  await store.save('client', {access_token: 'test-secret'});
  const file = (await fs.readdir(root)).find(name => name.startsWith('session-'));
  assert.doesNotMatch(await fs.readFile(path.join(root, file), 'utf8'), /test-secret/);
  assert.equal((await store.load('client')).access_token, 'test-secret');
  const failed = credentialStore(root, {platform: 'win32', protect: async () => { throw Error('DPAPI unavailable'); }});
  await assert.rejects(failed.save('other', {access_token: 'secret'}), /DPAPI/);
});
test('authentication lock prevents competing refreshes and releases after failure', async t => {
  const root = await fixture(t);
  await withAuthLock(root, async () => { await assert.rejects(withAuthLock(root, async () => {}), /Another harness/); });
  await assert.rejects(withAuthLock(root, async () => {throw Error('failed');}), /failed/);
  await withAuthLock(root, async () => {});
});
