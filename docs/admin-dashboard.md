# Admin dashboard

The web dashboard is at `/admin`. Header and mobile-menu navigation appear only for the authenticated database-backed admin role. Direct routes wait for authentication initialization, send guests to login, and send regular users to their profile. Every `/api/admin` endpoint uses `requireAuth` and `requireRole("admin")`. Tokens identify the user; the database supplies the current role and active status on every request.

Admins can view live resource totals, search and paginate users, inspect safe account details and resource counts, change another user's role, deactivate or restore accounts, and manage shared and personal exercises, workout templates, and completed workout records. New exercises/templates are shared. Existing ownership and visibility are preserved; personal exercises cannot be inserted into shared templates. Categories are the existing fixed template categories, not a separate database resource. Open drafts are counted but not edited because they represent an in-progress user session.

Account deactivation uses the existing soft-delete fields and immediately denies authenticated API requests, retaining personal records. Workout deletion also uses existing soft-delete fields. Templates and unreferenced exercises are permanently deleted; referenced exercise deletion is rejected. Historical exercise names and recorded sets are retained when an exercise is edited.

## Database setup

Use a MongoDB replica set (including a single-node local replica set) or an Atlas cluster. Role/status changes and account deletion use a transaction and a shared `adminlocks` document to serialize changes, including deletion through the existing account API. This prevents concurrent actions from removing the last active admin. Transactions fail closed on standalone MongoDB; configure the replica set before using account deletion or administration. No reset or data migration is needed: existing roles and soft-delete fields are reused, and the lock collection is created on first account mutation. No accounts are automatically promoted.

## Assign the initial admin

A trusted database operator should verify the identity of an existing registered account, record the operation, and run this against the application's database using their authenticated MongoDB tooling. Substitute its exact `_id`; do not copy a placeholder ID or supply credentials in source control.

```javascript
const accountId = ObjectId("REPLACE_WITH_VERIFIED_EXISTING_ACCOUNT_ID");
db.users.findOne({ _id: accountId, deletedAt: null }, { _id: 1, username: 1, email: 1, role: 1 });
// After verifying the account and confirming no initial admin has been assigned:
db.users.updateOne(
  { _id: accountId, role: "user", deletedAt: null },
  { $set: { role: "admin" } }
);
```

Confirm that exactly one record matched. Refresh the authenticated app so `/api/auth/me` reloads the role. Subsequent assignments should use the dashboard. Admins cannot change their own role/status there; use another trusted admin. Passwords, hashes, and tokens are never returned by admin endpoints. No default credentials are created.

## Verification

Run `npm run test --workspace=backend`, `npm run test --workspace=web`, `npm run build:backend`, `npm run build:web`, and `npm run lint`. Backend tests exercise HTTP authorization with signed tokens and stubbed database reads, strict request validation, shared ownership, referenced deletion, and account mutation safeguards with stubbed transactions. They do not replace a deployment check against a real replica set, particularly for transaction conflict/retry behavior.

After the web build, run `node apps/web/tests/adminBrowserCheck.cjs` for headless Edge checks of direct-route access, authentication initialization, mobile overflow, form operations, confirmation cancellation, pagination, and error recovery. Set `UI_BROWSER_PATH` if Edge is installed elsewhere. The browser test supplies deterministic API responses; production uses real API requests.

The editor uses existing buttons, inputs, and accessible modal controls. Template/workout rows support explicit exercise IDs and sets; IDs are available in the Exercises listing. Workout owners use IDs from Users. This deliberately avoids downloading all personal resources into a picker.
