# Workout development harness — version 1

A local coding agent around this repository. No AI endpoint is added to the workout app.
Requires Node.js 22+ and Git. The harness itself has no npm dependencies: it uses Node's built-in fetch, file and process APIs.

## Components

- `agent.mjs`: WorkoutDevAgent's instructions and knowledge of this monorepo.
- `harness.mjs`: bounded model -> tool -> result loop, plus streaming ChatGPT plan-usage Responses adapter.
- `tools.mjs`: validated file tools, Git inspection and fixed verification commands.
- `auth.mjs`: browser OAuth, PKCE/state, ID-token verification, session reuse/refresh and model listing.
- `credentials.mjs`: Windows DPAPI protection (or Unix owner-only files), atomic writeback and refresh locking.
- `cli.mjs`: modes, worktree isolation and local reports.
- `harness.test.mjs`: offline tests, including a complete CLI/worktree run with a fake model.

## ChatGPT Plus/Pro authentication

This version uses the official Sign in with ChatGPT plan-usage flow. There is **no API-key request path or billing fallback**. OPENAI_API_KEY and OPENAI_MODEL from earlier instructions are ignored. Plan usage is limited and depends on your account/workspace authorization. This client does not purchase credits or enable automatic top-ups. ChatGPT plan usage can include available credits according to your ChatGPT settings; review those settings if you require included allowance only. When access is denied or limits are reached, the run fails and retains any existing worktree edits.

### Update your existing clone

Copy the entire `tools/dev-harness/` folder from this ZIP over your current folder. Keep your existing application changes. The `harness` and `test:harness` scripts and `.harness-runs/` ignore entry from version 1 stay the same. Commit the harness update before implement mode.

Start in Git Bash in the repository root:

```bash
unset OPENAI_API_KEY OPENAI_MODEL
npm run test:harness
npm run harness -- --login
```

The CLI prints a **Continue with ChatGPT** URL. Open it in your browser, select your Plus account and authorize ChatGPT plan usage for Workout Dev Harness. Return to the terminal to see the verification result. No model inference is performed by `--login`.

The harness keeps a stable host ID and client/account registration metadata under `~/.workout-dev-harness/registration.json`, outside the repository. OAuth credentials are saved in per-client session files in that directory. **Windows uses DPAPI CurrentUser encryption** through built-in Windows PowerShell; no plaintext fallback is allowed if encryption fails. The secrets travel through process stdin, not command-line arguments. On Unix, files use owner-only permissions (0600), without encryption. Keep this directory outside source control and do not share it.

On your first invocation after updating, authorize the account once. Later invocations reuse an unexpired saved session. Near expiry, the client automatically refreshes it and saves rotating refresh tokens atomically. Authentication operations use a lock to prevent two processes refreshing simultaneously. If a browser sign-in or refresh is already in progress, a second process asks you to retry. A crashed process's stale lock is recovered when its PID no longer exists; do not run authentication from multiple machines sharing the same credential directory.

To reauthorize after revocation or an invalid saved grant:

```bash
npm run harness -- --login --force-login
```

To sign out, revoke the selected renewable session and clear its local credentials:

```bash
npm run harness -- --logout
```

If remote revocation cannot be confirmed, the CLI clears local credentials and tells you to disconnect the app in ChatGPT Settings. Signing out retains host/client metadata for a later login. Use `--add-account` to register another account; it becomes the next active account. To switch back, set `active` to an earlier registration index in the metadata file.

A long-running task that crosses token expiry currently stops; restarting the invocation refreshes the session. No task or conversation resume is added in this update. Offline tests cover OAuth, session reuse, rotation and mocked Windows encryption; actual DPAPI and live automatic renewal need verification on your Windows machine. The full sign-in test also exercises native DPAPI when run on Windows.

After login has been verified, list account-specific model IDs:

```bash
npm run harness -- --models
```

For actual tasks, pass a slug from that list using `--model`. Without it, the first visible account model is selected. Do not assume the earlier API-key model choice is in your plan catalog.

```bash
npm run harness -- --mode ask "Explain how workout drafts become workout sessions."
npm run harness -- --mode plan "Plan support for editing exercise set counts."
npm run harness -- --mode review "Review workout draft creation for duplication bugs."
npm run harness -- --mode implement "Add relevant tests for workout draft creation."
```

The model catalog is an account-specific selection aid; only a completed inference turn confirms access. Preview availability, supported models and plan allowance are controlled by OpenAI. Initial live sign-in and inference have been confirmed by your terminal output. Persistent session reuse and automatic renewal still need live verification on your machine. Tests use simulated OAuth, signed test JWTs and model streams.

## Modes and checks

| Mode | Read/search/Git inspection | Source edits | Verification commands |
| --- | --- | --- | --- |
| ask | Yes | No | No |
| plan | Yes | No | No |
| review | Yes | No | With `--allow-checks` |
| implement | Yes | In a new worktree | With `--allow-checks` |

Allowed checks: `backend:build`, `web:build`, `web:lint`, `harness:test`. There is no generic shell tool, database tool, package installer, Git commit/push/merge tool or deployment tool. Existing backend/native packages have no test script; the harness does not pretend they do.

Example for an existing installed clone:

```bash
npm run harness -- --mode review --allow-checks "Review and verify the current changes."
```

A new implementation worktree does not have `node_modules`. Model calls can edit code and run `harness:test` there without installing anything. After the first run, enter the printed worktree, run `npm ci` yourself and run relevant project checks. To ask the agent to verify/fix that worktree, run its harness from that directory in review mode; implementation of follow-up fixes is deliberately a new clean-worktree run. You can also make local fixes yourself in the first worktree. Version 1 does not resume conversations or automatically install dependencies.

`--allow-checks` authorizes execution of repository code on your computer. Build, lint and test commands may execute source, scripts and configuration edited by the agent. They are **not an OS sandbox** and review-mode checks may create build outputs. Run only trusted repositories; use a disposable container/VM if stronger isolation is required. Do not expose production credentials to that environment. OPENAI_API_KEY is removed from the check process environment, but other inherited environment variables remain.

## Review and keep changes

`implement` requires a clean Git working directory with an existing commit. It creates branch `harness/<run-id>` and a worktree under `.harness-runs/<run-id>/worktree`. Your current branch and source files are left in place. Reports remain even if the loop fails.

Each run writes `events.json` (tool names/success, no arguments/content) and, on success, `result.md`. Implement runs also produce `status.txt` and `changes.patch`, including new files. Inspect the printed worktree and patch; check new files as well as the tracked diff.

To keep changes, commit them yourself inside that worktree and cherry-pick that commit onto your intended branch. Alternatively, from your original clone use `git apply --check "<absolute-path>/changes.patch"`, then `git apply "<absolute-path>/changes.patch"` after reviewing it. No automatic application, commit or merge takes place. Remove a worktree only after preserving the changes using `git worktree remove "<path>"`; Git refuses ordinary removal when it contains uncommitted changes.

## Boundaries and limitations

File tools reject traversal, absolute paths, symlinks, `.env*`, common key files and generated/dependency/Git directories. The agent cannot edit its harness or AGENTS.md policy through file tools. This is a guardrail, not a guarantee that all secrets in source files will be recognized. Files you ask the agent to read and tool results are sent to OpenAI. Inspect the repository for hard-coded secrets before running it. Git inspection sent to the model filters protected paths; source files can still contain hard-coded secrets. Local patch reports retain all tracked changes for your review.

Default limits: 20 model steps, 60 tool calls, 150,000 cumulative reported tokens, 500,000 characters of accumulated context, 120-second API/check timeout. Limits stop execution; they do not guarantee a fixed bill or undo changes. Tool output is truncated; search narrow directories when necessary. No inference retries are made to avoid duplicating model requests. A stopped run is not successful verification.

One task per invocation; no persistent conversation, multi-agent delegation, auto-approval, destructive file deletion or arbitrary terminal commands. Offline tests verify orchestration and guards; a live run requires ChatGPT authorization and has not been verified as part of this delivery.

Official API reference: https://developers.openai.com/api/docs/guides/function-calling

Official plan-usage documentation:
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
