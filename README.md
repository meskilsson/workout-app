# Workout App

A full-stack workout tracker for personal training: build workouts by muscle group, choose exercises, log sets, use training timers, and save workout history. The repository contains a working web application, an Express API, shared TypeScript code, and an early Expo mobile application.

The project is in active development. The web workout flow, personal templates, and admin dashboard are implemented; the native client has only part of the web functionality.

## Implemented features

### Web application

- Signup, login, logout, protected routes, profile updates, password changes, and account deletion.
- Public exercise browsing and an authenticated library combining shared exercises with the user's custom exercises. Search, muscle filters, pagination, details, and custom exercise creation, editing, and deletion are supported.
- Primary/secondary muscle previews with male and female body models.
- Workout drafts: select muscle groups and exercises, review the workout, reorder exercises with drag and drop, add/remove sets, and enter weight and reps.
- Workout duration and rest timers, set completion tracking, workout completion, and draft abandonment.
- Browser-local recovery of workout references, set progress, and timer state, scoped by user and draft. Recovery checks the draft against the API; this is not a complete offline mode.
- Workout results and history, saved-session details, deletion from history, and repeating a previous workout.
- Shared workout template browsing and personal template creation, editing, deletion, and starting workouts from templates. Templates include categories, exercise order, and planned sets.
- An admin dashboard with real resource counts and management operations, described below.
- Responsive layouts, reusable controls and dialogs, loading/error/empty states, and **Light** and **Dark** themes. Removed theme preferences are mapped to one of these two themes.

### Native application

The Expo client implements login, stored authentication with Expo SecureStore, profile display/refresh, logout, and Home/Train/Workouts navigation. The Train screen can select muscles, create a backend draft, choose exercises from the authenticated library, save the selected exercises, and start the draft. Its active-workout view currently adds empty sets only to local component state.

The native Workouts screen is a placeholder. Native weight/reps entry, completed-workout saving, history, templates, and admin screens are not implemented. API helpers for set updates and workout completion exist but are not connected to the current Train screen. An `ExercisesScreen` exists, but the current navigator does not register it; the Home screen's Exercises button therefore has no matching route. Create an account through the web app before using native login.

## Screenshots

The existing galleries are historical snapshots of the earlier UI and removed themes, rather than screenshots of the current Light/Dark design.

| Historical theme | Body model | Gallery |
| --- | --- | --- |
| Charcoal | Male | [View screenshots](docs/screenshots/charcoal-male) |
| Pink | Female | [View screenshots](docs/screenshots/pink-female) |

## Technology stack

| Area | Technologies |
| --- | --- |
| Web | React 19, TypeScript, Vite 8, React Router 7, CSS Modules, dnd-kit, Lucide icons, React Body Highlighter |
| Backend | Node.js, Express 5, TypeScript, Mongoose 9, MongoDB, Zod validation, bcrypt, JSON Web Tokens, cookie-parser, CORS, dotenv |
| Native | Expo SDK 54, React Native 0.81, React Navigation, Expo SecureStore |
| Shared | TypeScript types/constants, workout and rest-timer logic, current-workout context |
| Tooling | npm workspaces and lockfile, tsx, TypeScript compiler, ESLint for the web app, Node's test runner, headless browser checks |

The shared package exports TypeScript source directly. Install and run this project from the monorepo root so its workspace dependencies resolve together.

## Project structure

```text
workout-app/
|-- apps/
|   |-- backend/         # API routes/controllers/services, schemas, MongoDB models, seeds, tests
|   |-- web/             # React pages, routing, contexts, components, styles, tests
|   `-- native/          # Expo screens, navigation, API clients, secure token storage
|-- packages/
|   `-- shared/          # Shared types, constants, contexts, and timer logic
|-- docs/
|   |-- admin-dashboard.md
|   `-- screenshots/
|-- package.json        # Workspace and development/build scripts
|-- package-lock.json
|-- vercel.json         # Web build/output configuration and SPA rewrite
`-- README.md
```

## Getting started

### Prerequisites

- Node.js and npm with workspace support. The locked Vite version requires Node `^20.19.0 || >=22.12.0`; React Native/Metro require Node `>=20.19.4`. Node **22.12 or newer** satisfies both stated engine requirements. The repository does not pin a Node version.
- A MongoDB database. Use an initialized **replica set**, including a single-node local replica set, or an Atlas cluster for the full application. Role/status changes and account deletion use transactions and fail on standalone MongoDB.
- For native development, a compatible Expo client/device or emulator. The repository provides Expo development scripts, not app-store build/release scripts.

### 1. Install dependencies

From your checkout's root:

```bash
npm ci
```

`npm install` is also available when intentionally updating dependencies. In Windows PowerShell environments that block `npm.ps1`, use `npm.cmd` for the same commands.

### 2. Configure the backend

Copy the tracked example without overwriting an existing local configuration:

```bash
cp apps/backend/.env.example apps/backend/.env
```

PowerShell equivalent:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`. This example assumes a local replica set named `rs0` is already initialized:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/workout_app?replicaSet=rs0
DB_NAME=workout_app
JWT_SECRET=REPLACE_WITH_A_LOCALLY_GENERATED_RANDOM_VALUE
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Generate a random JWT secret locally, then put the output only in the backend environment file:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable | Usage |
| --- | --- |
| `MONGODB_URI` | Required backend/seed database connection string. Replace the local example with your own connection string when using Atlas or a differently configured replica set. |
| `JWT_SECRET` | Required by authentication; startup throws if missing. Replace the example placeholder. |
| `PORT` | Optional API port; defaults to `5000`. |
| `DB_NAME` | Optional explicit database name used by the backend and seed scripts. If omitted, the URI/driver determines the database. It is supported in code but absent from the tracked example. |
| `NODE_ENV` | `development` enables detailed error responses. `production` enables secure cookies with `SameSite=None`; cookie authentication then requires HTTPS. |
| `CORS_ORIGIN`, `CORS_ORIGINS` | Optional comma-separated browser origins added to the API's built-in allowlist. Include any different frontend development origin. |

The API already allows localhost ports `5173`, `4173`, and `8081`, plus the web origin hardcoded in `server.ts`. CORS requests use credentials. Environment files are ignored by Git, apart from `.env.example`; do not commit credentials or connection strings containing passwords.

### 3. Configure the clients

The web API base URL defaults to `http://localhost:5000`. For a different backend, copy `apps/web/.env.example` to `apps/web/.env` and set:

```env
VITE_API_URL=http://localhost:5000
```

For native development, create `apps/native/.env` manually; no native `.env.example` is tracked:

```env
EXPO_PUBLIC_API_URL=http://192.0.2.10:5000
```

The address above is a documentation placeholder. Replace it with the backend address reachable from your device/emulator. A physical device's `localhost` points to the device, not your development computer. The native client throws if `EXPO_PUBLIC_API_URL` is missing.

`VITE_*` and `EXPO_PUBLIC_*` values are client-visible configuration: do not put secrets in them. API base URLs should not include `/api`, because the clients append endpoint paths. Restart the development servers after environment changes.

### 4. Seed public exercises

```bash
npm run seed:exercises --workspace=backend
```

This uses `apps/backend/src/seed/seededExercises.expanded.ts` and upserts shared exercises by name, `isCustom: false`, and `createdBy: null`. It does not reset the database or delete personal data, but rerunning it overwrites matching shared exercise fields with seed values.

**Template seed limitation:** `npm run seed:templates --workspace=backend` exists, but its target, `seedWorkoutTemplates.ts`, currently contains exercise-seeding code. It does not create workout templates. Use the admin dashboard to create shared templates; personal templates can be created through the regular web flow.

### 5. Start locally

Run the web app and API together:

```bash
npm run dev:both
```

Or use separate terminals:

```bash
npm run dev:backend
npm run dev:web
```

Default URLs are `http://localhost:5173` for the web app and `http://localhost:5000` for the API. The API connects to MongoDB before listening; its root endpoint returns a backend-running message.

To start the native client after configuring its API URL:

```bash
npm run dev:native
```

`npm run dev:all` starts the API, web app, and Expo development server together. Workspace scripts run dotenv-backed backend commands from `apps/backend`, where its `.env` is located.

## Database models and migrations

MongoDB stores users, exercises, workout drafts, completed workout sessions, and workout templates. Shared exercises have no owner and are not custom; personal exercises belong to a user. Shared templates are public with no owner, while personal templates retain their owner's ID.

There is **no standalone migration runner or migration command** in this repository. Mongoose defines the models and indexes. Existing workout drafts receive missing stable set IDs when fetched by the draft service, and the admin lock collection is initialized on the first account mutation. Neither operation resets existing data.

Use a transaction-capable database before testing admin account changes or normal account deletion. The initial-admin assignment below is an explicit operator action, not an automatic startup migration.

## Authentication, roles, and administration

Passwords are hashed with bcrypt. Login issues a JWT valid for one day, sets an HTTP-only cookie for the web client, and returns the token for clients such as native. Native stores its token in Expo SecureStore and sends it as a Bearer token. Logout clears the browser cookie or native stored token; there is no refresh-token or server-side token-revocation system.

`requireAuth` verifies the token and reloads the user from MongoDB on each protected request. The database supplies the current role and active status; deleted/deactivated accounts are rejected. Signup defaults to `user`, and regular profile updates cannot assign roles.

The web `/admin` dashboard and its navigation are rendered for authenticated `admin` users. Protected routes wait for authentication initialization, redirect guests to `/login`, and redirect regular users to `/profile`. Every `/api/admin` route separately enforces authentication and the database-backed admin role.

Admin capabilities include:

- Live totals for active users/admins, completed workouts, exercises, shared exercises, templates, shared templates, and open drafts.
- Searchable, paginated user lists; safe account details and personal-resource counts; another user's role changes, account deactivation, and restoration.
- Searchable, paginated exercise/template/workout lists, shared/personal filters where applicable, details, creation, editing, and deletion.
- Management of other users' resources while preserving existing ownership and visibility. New admin-created exercises/templates are shared; workout records require an explicit owner. Shared templates cannot use personal exercises.
- Confirmation for destructive actions. Accounts and workout sessions are soft-deleted; templates and unreferenced exercises are permanently deleted. Admin exercise deletion is blocked when a template, draft, or workout references the exercise.

Admins cannot change their own role/status in the dashboard. Account mutations use a transaction and shared lock to protect the last active admin, including deletion through the regular account API. Admin responses exclude passwords, hashes, and tokens. Open drafts are counted but not edited; template categories are fixed values, not a separate managed resource. Admin editors currently use explicit exercise and owner IDs from the relevant listings.

### Assign an initial admin securely

1. Register an account normally through the web app.
2. A trusted database operator should verify that account's identity and exact MongoDB `_id`, using authenticated database tooling and the intended application database.
3. Check whether an active admin already exists. For initial setup only, inspect and explicitly promote the verified account:

```javascript
// Run in mongosh connected to the application's database.
db.users.countDocuments({ role: "admin", deletedAt: null });
const accountId = ObjectId("REPLACE_WITH_VERIFIED_EXISTING_ACCOUNT_ID");
db.users.findOne(
  { _id: accountId, deletedAt: null },
  { _id: 1, username: 1, email: 1, role: 1 }
);
// Proceed only if the count is 0 and the account identity is verified.
db.users.updateOne(
  { _id: accountId, role: "user", deletedAt: null },
  { $set: { role: "admin" } }
);
```

Confirm exactly one record matched and was modified, record the operator action, and refresh the authenticated web app to reload `/api/auth/me`. Use the dashboard for subsequent role assignments. No default admin credentials or automatic promotions are supplied. See [the admin setup and behavior guide](docs/admin-dashboard.md) for further details.

## Available commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:web` | Start Vite. |
| `npm run dev:backend` | Start the API with `tsx watch`. |
| `npm run dev:both` | Start web and API together. |
| `npm run dev:native` | Start Expo. |
| `npm run dev:all` | Start web, API, and Expo together. |
| `npm run build:web` | Run TypeScript checks and build web assets into `apps/web/dist`. |
| `npm run build:backend` | Compile backend TypeScript into `apps/backend/dist`. |
| `npm run lint` | Run workspace lint scripts where present; currently only web has one. |
| `npm run test --workspace=backend` | Run backend admin tests with Node's test runner. |
| `npm run test --workspace=web` | Run web tests with the tsx loader and Node's test runner. |
| `npm run seed:exercises --workspace=backend` | Upsert shared exercises in the configured database. |
| `npm run seed:templates --workspace=backend` | Currently seeds exercises, despite the name; see the limitation above. |
| `npm run start --workspace=backend` | Run `tsx src/server.ts`; this does not start the compiled `dist` output. |
| `npm run preview --workspace=web` | Preview an existing web build, normally on port `4173`. |
| `npm run lint --workspace=web` | Run the web ESLint configuration. |
| `npm run android --workspace=native` | Start Expo with Android launch requested. |
| `npm run ios --workspace=native` | Start Expo with iOS launch requested; a local iOS simulator requires macOS. |
| `npm run web --workspace=native` | Start Expo's web target; native storage/browser compatibility has not been verified here. |

There is no root `test` script, native test/lint/build script, or separate shared-package build script. Backend startup currently depends on `tsx`, which is a development dependency; a dependencies-only production install will not support the existing start command as written.

## Tests and browser checks

The backend suite exercises admin HTTP authorization, database-derived roles, invalid/deactivated authentication, role-escalation rejection, request validation, shared ownership, referenced-resource deletion, and account safeguards. Database reads and transactions are stubbed; these tests do not verify live MongoDB transaction conflicts/retries.

The web suite covers muscle mapping, themes and contrast, workout progress identity/storage, timer restoration, draft recovery and cleanup, and selected backend draft validation/migration behavior. These are targeted tests, not full application integration coverage.

Two additional browser scripts use a built web app, headless Edge, and mocked API responses:

```bash
npm run build:web
node apps/web/tests/adminBrowserCheck.cjs
node apps/web/tests/browserUiCheck.cjs
```

Set `UI_BROWSER_PATH` when the browser executable is installed elsewhere. Both scripts default to a Windows Edge path and use temporary browser profiles; `browserUiCheck.cjs` also writes screenshots to the temporary directory. The general UI checker supports `UI_CHECK_ROUTES`, `UI_CHECK_WIDTHS`, and `UI_CHECK_PHASE` filters. These scripts are separate from `npm test` and do not require a live API/database.

Commands and test coverage described here were checked against repository files. This README update does not assert a fresh passing build, lint run, or test run.

## Main API route groups

| Area | Registered prefix | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Login, logout, current user. |
| Users | `/api/users` | Signup, own-account details/updates/password changes/deletion, and authorized admin user access. |
| Exercises | `/api/exercises` | Public browsing, authenticated exercise library, personal exercise CRUD. |
| Workout drafts | `/api/workout-drafts` | Build, update, start, abandon, and complete drafts. |
| Workout sessions | `/api/workout-sessions` | Completed sessions, personal history/details/deletion, and repeating workouts. |
| Workout templates | `/api/workout-templates` | Shared/personal templates, personal CRUD, edit drafts, and starting workouts. |
| Administration | `/api/admin` | Admin totals, user role/status management, and exercise/template/session management. |

There is no registered `/api/workouts` route group. Administrative resources use `/api/admin/exercises`, `/api/admin/templates`, and `/api/admin/sessions`.

## Typical web workout flow

1. Sign up or log in.
2. Choose muscle groups and exercises, or start from a saved template/previous workout.
3. Review the draft and start training.
4. Enter weight/reps, add or remove sets, mark completed sets, and use the timers.
5. Complete the workout to save a session, then view its result and history entry; alternatively, abandon the draft.

## Limitations and unfinished work

- Native has partial functionality and the navigation gap described above; it does not yet match the web app.
- The template seed script does not seed templates. A fresh database needs templates created through the app/admin flow.
- Browser recovery depends on local storage and the backend draft. It does not provide cross-device synchronization of all browser-local progress or full offline training.
- Admin editors use resource IDs, and live transaction concurrency requires separate verification against a MongoDB replica set.
- Training analytics beyond session summaries/muscle metadata are not implemented. Completing native workout logging/history remains future work.
- Authentication has no refresh-token/revocation flow. The source has no dedicated login rate limiter or CSRF middleware; production security hardening remains incomplete.
- `vercel.json` specifies the web build output and SPA rewrite. It does not configure hosting for the API or MongoDB, and this repository does not provide a complete verified deployment procedure.
- Tests cover selected behaviors; native device behavior and live database/deployment operation are not verified by those suites. Web lint currently has existing React Hooks/Fast Refresh violations identified during the preceding implementation checks.

## Notes for portfolio reviewers

The project demonstrates a TypeScript monorepo, React routing and reusable UI, an Express REST API, MongoDB data modeling, JWT/cookie and native Bearer authentication, shared timer/state logic, a multi-step draft-to-session workflow, and server-authorized administration. Its incomplete native and production-hardening areas are described above rather than presented as finished features.

## License

No license file is currently included in the repository.
