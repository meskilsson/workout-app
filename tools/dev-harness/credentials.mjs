import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

// Windows DPAPI binds encryption to the current Windows user. Secrets travel through stdin, never argv.
export function windowsProtect(input, decrypt = false) {
  const action = decrypt ? 'Unprotect' : 'Protect';
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $result=[Security.Cryptography.ProtectedData]::${action}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result))`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', failed = false;
    const timer = setTimeout(() => { failed = true; child.kill(); reject(Error('Windows credential protection timed out')); }, 30000);
    child.stdout.on('data', data => { output += data; if (output.length > 1000000) child.kill(); });
    child.stderr.on('data', () => {}); // Never log PowerShell output that could include credential material.
    child.on('error', () => { failed = true; clearTimeout(timer); reject(Error('Windows credential protection unavailable; no plaintext fallback')); });
    child.on('close', code => { clearTimeout(timer); if (!failed) code === 0 ? resolve(output.trim()) : reject(Error('Windows credential protection failed; no plaintext fallback')); });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
export function credentialStore(directory, { platform = process.platform, protect = windowsProtect } = {}) {
  const fileFor = clientId => path.join(directory, 'session-' + createHash('sha256').update(clientId).digest('hex') + '.json');
  return {
    async load(clientId) {
      let data; try { data = JSON.parse(await fs.readFile(fileFor(clientId), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
      if (data.format === 'dpapi') {
        if (platform !== 'win32') throw Error('Windows session must be reopened by the same Windows user');
        return JSON.parse(Buffer.from(await protect(data.ciphertext, true), 'base64').toString('utf8'));
      }
      if (platform === 'win32' || data.format !== 'owner-only') throw Error('Unsupported credential format; no plaintext fallback on Windows');
      const stat = await fs.stat(fileFor(clientId));
      if ((stat.mode & 0o077) !== 0) throw Error('Session permissions must be owner-only');
      return data.session;
    },
    async save(clientId, session) {
      await fs.mkdir(directory, { recursive: true, mode: 0o700 });
      const data = platform === 'win32'
        ? { format: 'dpapi', ciphertext: await protect(Buffer.from(JSON.stringify(session)).toString('base64')) }
        : { format: 'owner-only', session };
      const target = fileFor(clientId), temporary = target + '.' + randomUUID() + '.tmp';
      try { await fs.writeFile(temporary, JSON.stringify(data), { flag: 'wx', mode: 0o600 }); await fs.rename(temporary, target); }
      finally { await fs.rm(temporary, { force: true }); }
    },
    async clear(clientId) { await fs.rm(fileFor(clientId), { force: true }); },
  };
}
export async function withAuthLock(directory, action) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const lock = path.join(directory, 'auth.lock');
  let handle;
  try { handle = await fs.open(lock, 'wx', 0o600); await handle.writeFile(String(process.pid)); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = Number(await fs.readFile(lock, 'utf8'));
    let alive = true;
    if (Number.isInteger(pid) && pid > 0) { try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; } }
    if (alive) throw Error('Another harness is signing in/refreshing. Retry when it finishes.');
    await fs.rm(lock, { force: true });
    return withAuthLock(directory, action);
  }
  try { return await action(); }
  finally { await handle.close(); await fs.rm(lock, { force: true }); }
}
