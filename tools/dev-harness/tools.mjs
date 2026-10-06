import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
export const exec = promisify(execFile);
const limit = 24000;
const clip = value => value.length > limit ? value.slice(0, limit) + '\n[truncated]' : value;
const denied = /(^|\/)(\.git|node_modules|dist|coverage|\.expo|\.harness-runs)(\/|$)|(^|\/)(\.env[^/]*|[^/]*\.(pem|key|p12|pfx)|id_rsa|id_ed25519)$/i;
export const checks = {
  'backend:build': ['npm', ['run', 'build:backend']],
  'web:build': ['npm', ['run', 'build:web']],
  'web:lint': ['npm', ['run', 'lint', '--workspace=web']],
  'harness:test': ['node', ['--test', 'tools/dev-harness/harness.test.mjs']],
};
export async function createTools(root, mode, allowChecks = false) {
  root = await fs.realpath(root);
  const writable = mode === 'implement';
  async function safe(relative, write = false) {
    if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative)) throw Error('Use a relative POSIX path');
    const normalized = path.posix.normalize(relative);
    if (normalized === '..' || normalized.startsWith('../') || denied.test(relative) || denied.test(normalized)) throw Error('Path denied');
    if (write && /^(tools\/dev-harness|AGENTS\.md)(\/|$)/.test(normalized)) throw Error('Harness policy cannot edit itself');
    let current = root;
    for (const part of normalized.split('/').filter(p => p !== '.')) {
      current = path.join(current, part);
      try { if ((await fs.lstat(current)).isSymbolicLink()) throw Error('Symlinks denied'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    return current;
  }
  async function files(relative = '.') {
    const base = await safe(relative);
    const found = [];
    async function walk(dir) {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name), rel = path.relative(root, full).split(path.sep).join('/');
        if (denied.test(rel) || entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile()) found.push(rel);
        if (found.length > 10000) throw Error('Too many files; narrow the directory');
      }
    }
    await walk(base);
    return found;
  }
  async function read(relative) {
    const full = await safe(relative), stat = await fs.stat(full);
    if (!stat.isFile() || stat.size > 200000) throw Error('Not a small text file');
    const data = await fs.readFile(full);
    if (data.includes(0)) throw Error('Binary file denied');
    return data.toString('utf8');
  }
  const handlers = {
    list_files: async ({ directory }) => clip((await files(directory)).join('\n')),
    read_file: async ({ path: relative }) => clip(await read(relative)),
    search_code: async ({ query, directory }) => {
      if (!query || query.length > 200) throw Error('Invalid literal search');
      const matches = [];
      for (const file of await files(directory)) {
        let content; try { content = await read(file); } catch { continue; }
        content.split('\n').forEach((line, index) => { if (line.includes(query)) matches.push(`${file}:${index + 1}:${line}`); });
        if (matches.join('\n').length > limit) break;
      }
      return clip(matches.join('\n'));
    },
    git_status: async () => clip((await exec('git', ['status', '--short'], { cwd: root })).stdout),
    git_diff: async () => {
      const paths = (await exec('git', ['ls-files', '-z'], { cwd: root })).stdout.split('\0').filter(Boolean);
      const allowed = [];
      for (const file of paths) { try { await safe(file); allowed.push(file); } catch { /* filtered */ } }
      const tracked = allowed.length ? (await exec('git', ['diff', 'HEAD', '--no-ext-diff', '--no-textconv', '--', ...allowed], { cwd: root, maxBuffer: 2000000 })).stdout : '';
      const untracked = (await exec('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root })).stdout;
      return clip(tracked + '\nUntracked files (use read_file to inspect):\n' + untracked);
    },
    replace_text: async ({ path: relative, old_text, new_text }) => {
      if (!writable) throw Error('Writes disabled in this mode');
      if (!old_text || typeof new_text !== 'string' || new_text.length > 100000) throw Error('Invalid replacement');
      const full = await safe(relative, true), content = await read(relative);
      if (content.split(old_text).length !== 2) throw Error('old_text must match exactly once; read the file again');
      await fs.writeFile(full, content.replace(old_text, () => new_text));
      return 'Updated ' + relative;
    },
    create_file: async ({ path: relative, content }) => {
      if (!writable) throw Error('Writes disabled in this mode');
      if (typeof content !== 'string' || content.length > 100000) throw Error('Invalid content');
      const full = await safe(relative, true);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content, { flag: 'wx' });
      return 'Created ' + relative;
    },
    run_check: async ({ name }) => {
      if (!allowChecks || !['implement', 'review'].includes(mode)) throw Error('Checks require --allow-checks in implement/review');
      if (!Object.hasOwn(checks, name)) throw Error('Unknown check');
      const [command, args] = checks[name];
      // npm.cmd needs cmd.exe on Windows. All arguments are fixed here, never model-supplied.
      const executable = process.platform === 'win32' && command === 'npm' ? 'cmd.exe' : command;
      const argv = executable === 'cmd.exe' ? ['/d', '/s', '/c', 'npm ' + args.join(' ')] : args;
      const env = { ...process.env }; delete env.OPENAI_API_KEY;
      try {
        const result = await exec(executable, argv, { cwd: root, env, timeout: 120000, maxBuffer: 2000000 });
        return { name, exitCode: 0, output: clip(result.stdout + result.stderr) };
      } catch (error) {
        return { name, exitCode: error.code ?? null, timedOut: Boolean(error.killed), output: clip((error.stdout ?? '') + (error.stderr ?? '') + '\n' + error.message) };
      }
    },
  };
  const fields = {
    list_files: ['directory'], read_file: ['path'], search_code: ['query', 'directory'],
    git_status: [], git_diff: [], replace_text: ['path', 'old_text', 'new_text'],
    create_file: ['path', 'content'], run_check: ['name'],
  };
  const descriptions = {
    list_files: 'List text/source paths in a directory. Use . for repository root.',
    read_file: 'Read a small repository text file.', search_code: 'Search literal text, not a regular expression.',
    git_status: 'Show changed and untracked paths.', git_diff: 'Show tracked diff against HEAD and untracked names.',
    replace_text: 'Replace exactly one occurrence in an existing file; read it first.',
    create_file: 'Create a new text file; never overwrite.', run_check: 'Run a fixed check: ' + Object.keys(checks).join(', '),
  };
  const enabled = Object.keys(fields).filter(name => (writable || !['replace_text', 'create_file'].includes(name)) && (name !== 'run_check' || (allowChecks && ['implement', 'review'].includes(mode))));
  return {
    definitions: enabled.map(name => ({ type: 'function', name, description: descriptions[name], strict: true,
      parameters: { type: 'object', properties: Object.fromEntries(fields[name].map(key => [key, { type: 'string' }])), required: fields[name], additionalProperties: false } })),
    async execute(name, args) {
      if (!enabled.includes(name)) throw Error('Tool disabled: ' + name);
      if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length !== fields[name].length || fields[name].some(key => typeof args[key] !== 'string')) throw Error('Invalid tool arguments');
      return handlers[name](args);
    },
  };
}
