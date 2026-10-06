#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createTools, exec } from './tools.mjs';
import { signIn, signOut, listModels } from './auth.mjs';
import { instructions } from './agent.mjs';
import { runHarness, chatGPTRequest } from './harness.mjs';

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    mode: { type: 'string', default: 'ask' }, model: { type: 'string' },
    'allow-checks': { type: 'boolean', default: false }, help: { type: 'boolean' }, login: { type: 'boolean' }, logout: { type: 'boolean' }, 'force-login': { type: 'boolean' }, models: { type: 'boolean' }, 'add-account': { type: 'boolean' },
  } });
  if (values.help) {
    console.log('npm run harness -- --mode ask|plan|review|implement [--model MODEL] [--allow-checks] "Task"\nUses Continue with ChatGPT; no API key. --login verifies/reuses sign-in; --force-login reauthorizes; --logout clears/revokes the session; --models lists available models. implement requires a clean Git repo with a commit.');
    return;
  }
  if (values.logout) { await signOut(); return; }
  const mode = values.mode, requestedModel = values.model, message = positionals.join(' ');
  if (!['ask', 'plan', 'review', 'implement'].includes(mode)) throw Error('Unknown mode');
  if (!message.trim() && !values.login && !values.models) throw Error('Provide a task in quotes');
  const session = await signIn({ addAccount: values['add-account'], forceLogin: values['force-login'] });
  if (values.login && !values.models) return;
  const models = await listModels(session);
  if (values.models) { models.forEach(model => console.log(model.slug + ' — ' + model.display_name)); return; }
  const model = requestedModel ?? models[0]?.slug;
  if (!model || !models.some(item => item.slug === model)) throw Error('Model unavailable in account catalog; use --models to view choices');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const git = args => exec('git', args, { cwd: root, maxBuffer: 2000000 });
  let workspace = root;
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid;
  // Reports stay outside source control and are never made available to the model.
  const reports = path.join(root, '.harness-runs', id);
  await fs.mkdir(reports, { recursive: true });
  if (mode === 'implement') {
    if ((await git(['status', '--porcelain'])).stdout.trim()) throw Error('Commit/stash your changes first. No source files were modified.');
    await git(['rev-parse', '--verify', 'HEAD']);
    workspace = path.join(reports, 'worktree');
    await git(['worktree', 'add', '-b', 'harness/' + id, workspace, 'HEAD']);
    console.log('Isolated worktree: ' + workspace);
    console.log('Dependencies are not copied. Install them here manually before enabling project build/lint checks.');
  }
  console.log(`Mode: ${mode}; model: ${model}; checks: ${values['allow-checks'] ? 'enabled' : 'disabled'}`);
  const tools = await createTools(workspace, mode, values['allow-checks']);
  const events = [];
  try {
    const result = await runHarness({ model, message, instructions: instructions(mode), tools,
      request: chatGPTRequest(session), log: event => {
        events.push(event); console.log(`[${event.step}] ${event.tool}: ${event.ok ? 'ok' : 'failed'}`);
      } });
    await fs.writeFile(path.join(reports, 'result.md'), result.text + '\n');
    console.log('\n' + result.text);
  } finally {
    await fs.writeFile(path.join(reports, 'events.json'), JSON.stringify(events, null, 2));
    if (mode === 'implement') {
      // Save tracked and newly created text-file changes without staging or committing.
      const status = await tools.execute('git_status', {});
      let patch = (await exec('git', ['diff', 'HEAD', '--no-ext-diff', '--no-textconv'], { cwd: workspace, maxBuffer: 10000000 })).stdout;
      const untracked = (await exec('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: workspace })).stdout.split('\0').filter(Boolean);
      for (const file of untracked) {
        try { await exec('git', ['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--', process.platform === 'win32' ? 'NUL' : '/dev/null', file], { cwd: workspace, maxBuffer: 2000000 }); }
        catch (error) { if (error.code === 1) patch += error.stdout; else throw error; }
      }
      await fs.writeFile(path.join(reports, 'changes.patch'), patch);
      await fs.writeFile(path.join(reports, 'status.txt'), status);
      console.log('\nChanges retained in: ' + workspace + '\nReview: git -C "' + workspace + '" diff\nPatch: ' + path.join(reports, 'changes.patch'));
    }
    console.log('Run report: ' + reports);
  }
}
main().catch(error => { console.error('Harness stopped: ' + error.message); process.exitCode = 1; });
