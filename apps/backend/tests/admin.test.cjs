require('tsx/cjs');
process.env.JWT_SECRET = 'test-only-secret-never-used-by-the-application';
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/User.ts').default;
const Exercise = require('../src/models/Exercises.ts').default;
const Template = require('../src/models/WorkoutTemplate.ts').default;
const Session = require('../src/models/WorkoutSession.ts').default;
const Draft = require('../src/models/WorkoutDraft.ts').default;
const adminRouter = require('../src/routes/adminRoutes.ts').default;
const userRouter = require('../src/routes/userRoutes.ts').default;
const { manageUser } = require('../src/services/adminUserService.ts');
const { createUserSchema, updateUserSchema } = require('../src/schemas/userSchemas.ts');
const { adminListSchema } = require('../src/schemas/adminSchemas.ts');
const { deleteUser } = require('../src/services/userService.ts');
const actorId = '0123456789abcdef01234567', targetId = '0123456789abcdef01234568';
function token(role = 'admin') { return jwt.sign({ id: actorId, role }, process.env.JWT_SECRET); }
async function withApi(run) {
  const app = express(); app.use(express.json()); app.use('/api/admin', adminRouter); app.use('/api/users', userRouter);
  app.use((error, _req, res, _next) => res.status(error.statusCode ?? 500).json({ message: error.message, errors: error.errors }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try { await run(async (path, method = 'GET', body, bearer) => fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers: { ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })); }
  finally { await new Promise(resolve => server.close(resolve)); mock.restoreAll(); }
}
test('all admin API routes reject unauthenticated and regular users, including a token claiming admin', async () => {
  mock.method(User, 'findById', async () => ({ _id: new mongoose.Types.ObjectId(actorId), email: 'user@example.test', role: 'user', deletedAt: null }));
  await withApi(async request => {
    const paths = [['/admin/dashboard', 'GET'], ...['users', 'exercises', 'templates', 'sessions'].flatMap(resource => [
      [`/admin/${resource}`, 'GET'], [`/admin/${resource}/${targetId}`, 'GET'], [`/admin/${resource}/${targetId}`, resource === 'users' ? 'PATCH' : 'PUT'],
      ...(resource === 'users' ? [] : [[`/admin/${resource}`, 'POST'], [`/admin/${resource}/${targetId}`, 'DELETE']]),
    ])];
    for (const [path, method] of paths) {
      assert.equal((await request(path, method, method === 'GET' ? undefined : {})).status, 401);
      assert.equal((await request(path, method, method === 'GET' ? undefined : { role: 'admin' }, token())).status, 403);
    }
  });
});
test('database admin role permits access even when the signed token has an old user role; totals are queried', async () => {
  mock.method(User, 'findById', async () => ({ _id: new mongoose.Types.ObjectId(actorId), role: 'admin', deletedAt: null }));
  for (const model of [User, Exercise, Template, Session, Draft]) mock.method(model, 'countDocuments', async () => 7);
  await withApi(async request => {
    const response = await request('/admin/dashboard', 'GET', undefined, token('user'));
    assert.equal(response.status, 200); assert.equal((await response.json()).workouts, 7);
  });
});
test('deactivated admins and invalid signatures cannot access admin endpoints', async () => {
  mock.method(User, 'findById', async () => ({ role: 'admin', deletedAt: new Date() }));
  await withApi(async request => {
    assert.equal((await request('/admin/dashboard', 'GET', undefined, token())).status, 401);
    assert.equal((await request('/admin/dashboard', 'GET', undefined, 'forged')).status, 401);
  });
});
test('signup and profile edits reject role escalation; list queries have bounded pagination', () => {
  assert.equal(createUserSchema.safeParse({ name: 'Test', email: 'test@example.test', username: 'test', password: 'long-password', role: 'admin' }).success, false);
  assert.equal(updateUserSchema.safeParse({ role: 'admin' }).success, false);
  assert.equal(adminListSchema.safeParse({ limit: 10000 }).success, false);
  assert.equal(adminListSchema.safeParse({ page: 0 }).success, false);
});
test('HTTP validation rejects client-controlled ownership and invalid workout dates', async () => {
  mock.method(User, 'findById', async () => ({ _id: new mongoose.Types.ObjectId(actorId), role: 'admin', deletedAt: null }));
  await withApi(async request => {
    assert.equal((await request('/admin/exercises', 'POST', { name: 'Bench', createdBy: actorId, isCustom: false }, token())).status, 400);
    const response = await request('/admin/sessions', 'POST', { userId: actorId, exercises: [{ exerciseName: 'Bench', sets: [{ reps: 10, weight: 20 }] }], startedAt: '2026-10-06T12:00:00Z', endedAt: '2026-10-06T11:00:00Z' }, token());
    assert.equal(response.status, 400); assert.equal((await response.json()).errors[0].field, 'endedAt');
  });
});
test('shared exercise creation sets ownership on the server and referenced deletion is blocked', async () => {
  mock.method(User, 'findById', async () => ({ _id: new mongoose.Types.ObjectId(actorId), role: 'admin', deletedAt: null }));
  let created;
  mock.method(Exercise, 'create', async data => { created = data; return { _id: targetId, ...data }; });
  mock.method(Template, 'exists', async () => ({ _id: targetId })); mock.method(Draft, 'exists', async () => null); mock.method(Session, 'exists', async () => null);
  await withApi(async request => {
    assert.equal((await request('/admin/exercises', 'POST', { name: 'Bench' }, token())).status, 201);
    assert.equal(created.createdBy, null); assert.equal(created.isCustom, false);
    assert.equal((await request(`/admin/exercises/${targetId}`, 'DELETE', undefined, token())).status, 409);
  });
});
function stubAccountTransaction(count = 1, role = 'admin') {
  const target = { id: targetId, role, deletedAt: null, save: mock.fn(async () => {}) };
  const actor = { role: 'admin', deletedAt: null };
  const lock = mock.method(mongoose.models.AdminLock, 'updateOne', async () => ({}));
  const transaction = mock.fn(async callback => callback());
  mock.method(mongoose, 'startSession', async () => ({ withTransaction: transaction, endSession: async () => {} }));
  mock.method(User, 'findById', () => ({ session: async () => target }));
  mock.method(User, 'findOne', () => ({ session: async () => actor }));
  mock.method(User, 'countDocuments', () => ({ session: async () => count }));
  return { target, lock, transaction };
}
test('last active admin cannot be demoted, deactivated, or deleted through the legacy account service', async () => {
  const { target } = stubAccountTransaction();
  try {
    await assert.rejects(manageUser(targetId, actorId, { role: 'user' }), /last active admin/);
    await assert.rejects(manageUser(targetId, actorId, { active: false }), /last active admin/);
    await assert.rejects(deleteUser(targetId, actorId), /last active admin/);
    await assert.rejects(deleteUser(targetId, targetId), /last active admin/);
    assert.equal(target.save.mock.callCount(), 0);
  } finally { mock.restoreAll(); }
});
test('admin cannot change own role; authorized changes serialize with the admin lock and preserve deletion metadata', async () => {
  await assert.rejects(manageUser(actorId, actorId, { role: 'user' }), /another admin/);
  const { target, lock, transaction } = stubAccountTransaction(2);
  try {
    await manageUser(targetId, actorId, { active: false });
    assert(target.deletedAt instanceof Date); assert.equal(target.deletedBy.toString(), actorId);
    assert.equal(transaction.mock.callCount(), 1);
    assert.deepEqual(lock.mock.calls[1].arguments[1], { $inc: { revision: 1 } });
    await manageUser(targetId, actorId, { active: true });
    assert.equal(target.deletedAt, null); assert.equal(target.deletedBy, null);
  } finally { mock.restoreAll(); }
});
