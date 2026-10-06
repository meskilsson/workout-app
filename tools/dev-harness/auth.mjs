import { credentialStore, withAuthLock } from './credentials.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { randomBytes, randomUUID, createHash, createPublicKey, verify } from 'node:crypto';
const issuer = 'https://auth.openai.com';
const resource = 'https://api.openai.com/v1';
const random = () => randomBytes(32).toString('base64url');
const scopes = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const authDirectory = path.join(os.homedir(), '.workout-dev-harness');
async function jsonRequest(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`ChatGPT sign-in HTTP ${response.status}; no API-key fallback is available`);
  return response.json();
}
export function verifyIdentity(token, keys, { clientId, nonce, now = Date.now() / 1000 }) {
  if (typeof token !== 'string') throw Error('Missing ID token');
  const parts = token.split('.');
  if (parts.length !== 3) throw Error('Invalid ID token');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw Error('Unsupported ID token signature');
  const jwk = keys.find(key => key.kid === header.kid && key.kty === 'RSA' && (!key.use || key.use === 'sig') && (!key.alg || key.alg === 'RS256'));
  if (!jwk || !verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'))) throw Error('Invalid ID token signature');
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer || !audiences.includes(clientId) || (audiences.length > 1 && claims.azp !== clientId)) throw Error('ID token issuer/audience mismatch');
  if (typeof claims.exp !== 'number' || claims.exp <= now - 5 || typeof claims.iat !== 'number' || claims.iat > now + 5 || (claims.nbf && claims.nbf > now + 5)) throw Error('ID token outside valid time window');
  if ((nonce !== undefined && claims.nonce !== nonce) || typeof claims.sub !== 'string' || !claims.sub) throw Error('ID token nonce/identity mismatch');
  return claims;
}
export function authorizationUrl({ clientId, hostId, state, nonce, verifier, redirectUri }) {
  const url = new URL(issuer + '/api/accounts/authorize');
  url.search = new URLSearchParams({ client_id: clientId ?? 'dynamic_agent_client', ext_agent_host_id: hostId,
    response_type: 'code', redirect_uri: redirectUri, scope: scopes, resource, state, nonce,
    code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    ...(clientId ? {} : { agent_name_hint: 'Workout Dev Harness' }),
  }).toString();
  return url.href;
}
export function validateCallback(url, { state, clientId }) {
  if (url.searchParams.get('state') !== state) throw Error('OAuth state mismatch');
  if (url.searchParams.has('error')) throw Error('ChatGPT authorization denied; no model request was made');
  const issued = url.searchParams.get('client_id') ?? clientId;
  if (!issued || issued === 'dynamic_agent_client' || (clientId && issued !== clientId)) throw Error('Invalid issued client registration');
  const code = url.searchParams.get('code');
  if (!code) throw Error('Missing authorization code');
  return { clientId: issued, code };
}
export function requirePlanPermission(tokens) {
  const granted = typeof tokens.scope === 'string' ? tokens.scope.split(/\s+/) : [];
  if (!granted.includes('chatgpt.tokens.use.direct') || !granted.includes('resource.invoke') || tokens.token_type?.toLowerCase() !== 'bearer' || typeof tokens.access_token !== 'string' || !tokens.access_token || tokens.access_token.startsWith('sk-')) throw Error('ChatGPT plan usage was not granted. No API-key fallback is available.');
}
export async function signIn(options = {}) {
  return withAuthLock(options.storageDirectory ?? authDirectory, () => signInUnlocked(options));
}
async function signInUnlocked({ addAccount = false, forceLogin = false, print = console.log, storageDirectory = authDirectory, fetchImpl = fetch, store = credentialStore(storageDirectory) } = {}) {
  const directory = storageDirectory;
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const recordPath = path.join(directory, 'registration.json');
  let record;
  try { record = JSON.parse(await fs.readFile(recordPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  record ??= { hostId: 'urn:uuid:' + randomUUID(), accounts: [] };
  const selected = addAccount ? undefined : record.accounts[record.active ?? 0];
  if (selected && !forceLogin) {
    const saved = await store.load(selected.clientId);
    if (saved) {
      if (saved.clientId !== selected.clientId || saved.subject !== selected.subject) throw Error('Saved session identity mismatch');
      requirePlanPermission(saved);
      if (Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now() + 60000) {
        print('Reusing ChatGPT plan session for ' + (selected.email || selected.subject));
        return { accessToken: saved.access_token, expiresAt: saved.expiresAt };
      }
      if (saved.refresh_token) {
        const next = await jsonRequest(issuer + '/api/accounts/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', client_id: selected.clientId, refresh_token: saved.refresh_token, resource }),
        }, fetchImpl);
        if (typeof next.access_token !== 'string' || !next.access_token) throw Error('Refresh returned no access token; use --force-login');
        const refreshed = { ...saved, ...next, scope: next.scope ?? saved.scope, refresh_token: next.refresh_token ?? saved.refresh_token };
        requirePlanPermission(refreshed);
        if (next.id_token) {
          const jwks = await jsonRequest(issuer + '/.well-known/jwks.json', {}, fetchImpl);
          const identity = verifyIdentity(next.id_token, jwks.keys, { clientId: selected.clientId });
          if (identity.sub !== saved.subject) throw Error('Refreshed identity mismatch');
        }
        const lifetime = Number(next.expires_in);
        if (!Number.isFinite(lifetime) || lifetime <= 0) throw Error('Invalid refreshed token expiry');
        refreshed.expiresAt = Date.now() + lifetime * 1000;
        await store.save(selected.clientId, refreshed);
        print('ChatGPT plan session renewed for ' + (selected.email || selected.subject));
        return { accessToken: refreshed.access_token, expiresAt: refreshed.expiresAt };
      }
    }
  }

  const state = random(), nonce = random(), verifier = random();
  let resolveCallback, rejectCallback, consumed = false;
  const callback = new Promise((resolve, reject) => { resolveCallback = resolve; rejectCallback = reject; });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method !== 'GET' || url.pathname !== '/auth/callback' || consumed) { res.writeHead(404); res.end(); return; }
    // A stray local request must not consume the pending attempt.
    if (url.searchParams.get('state') !== state) { res.writeHead(400); res.end('Invalid state'); return; }
    consumed = true;
    try { const result = validateCallback(url, { state, clientId: selected?.clientId }); res.end('Return to your terminal to finish verification.'); resolveCallback(result); }
    catch (error) { res.writeHead(400); res.end('Sign-in was not completed. Return to your terminal.'); rejectCallback(error); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const redirectUri = `http://127.0.0.1:${server.address().port}/auth/callback`;
  const timer = setTimeout(() => rejectCallback(Error('Sign-in timed out; run the command again')), 300000);
  let pending;
  try {
    print('Continue with ChatGPT — open this URL in your browser:');
    print(authorizationUrl({ clientId: selected?.clientId, hostId: record.hostId, state, nonce, verifier, redirectUri }));
    pending = await callback;
  } finally { clearTimeout(timer); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  // Save the registration without credentials even if exchange fails, to reuse the issued client next time.
  const existing = record.accounts.find(account => account.clientId === pending.clientId);
  const account = existing ?? { clientId: pending.clientId };
  if (!existing) record.accounts.push(account);
  record.active = record.accounts.indexOf(account);
  async function saveRegistration() {
    const temporary = recordPath + '.' + process.pid + '.tmp';
    await fs.writeFile(temporary, JSON.stringify(record, null, 2), { mode: 0o600 });
    await fs.rename(temporary, recordPath);
  }
  await saveRegistration();
  const tokens = await jsonRequest(issuer + '/api/accounts/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: pending.clientId, code: pending.code, code_verifier: verifier, redirect_uri: redirectUri, resource }),
  }, fetchImpl);
  const jwks = await jsonRequest(issuer + '/.well-known/jwks.json', {}, fetchImpl);
  const identity = verifyIdentity(tokens.id_token, jwks.keys, { clientId: pending.clientId, nonce });
  if (account.subject && account.subject !== identity.sub) throw Error('Signed-in account does not match this registration');
  requirePlanPermission(tokens);
  account.subject = identity.sub; account.email = identity.email ?? '';
  await saveRegistration();
  print('ChatGPT plan usage authorized for ' + (account.email || account.subject));
  print('No API-key billing fallback. Session saved for future runs.');
  const lifetime = Number(tokens.expires_in);
  if (!Number.isFinite(lifetime) || lifetime <= 0) throw Error('Invalid access-token expiry');
  const expiresAt = Date.now() + lifetime * 1000;
  await store.save(account.clientId, { ...tokens, expiresAt, clientId: account.clientId, subject: identity.sub });
  return { accessToken: tokens.access_token, expiresAt };
}
export async function listModels(session, fetchImpl = fetch) {
  const catalog = await jsonRequest(resource + '/models', { headers: { Authorization: 'Bearer ' + session.accessToken } }, fetchImpl);
  if (!Array.isArray(catalog.models)) throw Error('Unexpected ChatGPT model catalog');
  return catalog.models.filter(model => model.visibility === 'list' && typeof model.slug === 'string');
}

export async function signOut({ storageDirectory = authDirectory, fetchImpl = fetch, print = console.log } = {}) {
  return withAuthLock(storageDirectory, async () => {
    let record; try { record = JSON.parse(await fs.readFile(path.join(storageDirectory, 'registration.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') { print('Already signed out'); return; } throw error; }
    const account = record.accounts[record.active ?? 0];
    if (!account) { print('Already signed out'); return; }
    const store = credentialStore(storageDirectory), session = await store.load(account.clientId);
    let revoked = !session?.refresh_token;
    try {
      if (session?.refresh_token) {
        const configuration = await jsonRequest(issuer + '/.well-known/openid-configuration', {}, fetchImpl);
        const endpoint = new URL(configuration.revocation_endpoint);
        if (endpoint.origin !== issuer) throw Error('Unexpected revocation endpoint');
        const response = await fetchImpl(endpoint.href, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: session.refresh_token, token_type_hint: 'refresh_token', client_id: account.clientId }),
        });
        revoked = response.ok;
      }
    } catch { revoked = false; }
    await store.clear(account.clientId);
    print(revoked ? 'Signed out of ChatGPT plan session' : 'Signed out locally; remote revocation was not confirmed. Disconnect Workout Dev Harness in ChatGPT Settings.');
  });
}
