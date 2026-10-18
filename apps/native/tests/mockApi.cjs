// Isolated, in-memory UI fixtures. This server never connects to MongoDB.
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const user = { _id: '0123456789abcdef01234568', name: 'Native review', username: 'native_review', email: 'native-review@example.test', role: 'admin' };
const exercises = [
  { _id: '0123456789abcdef01234569', name: 'Bench press', exerciseType: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], equipment: 'barbell', difficulty: 'beginner', isCustom: false, description: 'A fixture for native rendering checks.' },
  { _id: '0123456789abcdef01234570', name: 'Cycling', exerciseType: 'cardio', primaryMuscles: ['quads'], secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', isCustom: false },
];
let draft = { _id: '0123456789abcdef01234567', userId: user._id, status: 'active', purpose: 'workout', selectedMuscleGroups: ['chest'], includeCardio: true, startedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), exercises: [
  { exerciseId: exercises[0]._id, exerciseName: exercises[0].name, sets: [{ id: randomUUID(), weight: 40, reps: 8 }] },
  { exerciseId: exercises[1]._id, exerciseName: exercises[1].name, training: { format: 'intervals', rounds: 2, workSeconds: 2, restSeconds: 1 }, sets: [] },
] };
let sessions = [], templates = [], nextFailure = null;
const counts = {};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1'); let text = ''; for await (const chunk of req) text += chunk;
  const body = text ? JSON.parse(text) : {}; const path = url.pathname, method = req.method;
  res.setHeader('Content-Type', 'application/json');
  const send = (value, status = 200) => { res.writeHead(status); res.end(JSON.stringify(value)); };
  if (path === '/__fixture') return send({ draft, sessions, templates, counts });
  if (path === '/__fixture/fail') { nextFailure = body; return send({ ok: true }); }
  counts[`${method} ${path}`] = (counts[`${method} ${path}`] ?? 0) + 1;
  if (nextFailure && method !== 'GET') { const failure = nextFailure; nextFailure = null; return send(failure.body ?? { message: 'Fixture request failed' }, failure.status ?? 503); }
  if (path === '/api/auth/login' || path === '/api/auth/refresh') return send({ user, token: 'fixture-access', refreshToken: 'fixture-refresh' });
  if (path === '/api/auth/me') return send({ user });
  if (path === '/api/auth/logout') return send({ message: 'Logged out' });
  if (path.startsWith('/api/users')) return send(method === 'PATCH' ? { ...user, ...body } : user);
  if (path.startsWith('/api/admin/dashboard')) return send({ users: 1, admins: 1, exercises: exercises.length, templates: templates.length, workouts: sessions.length, drafts: draft ? 1 : 0 });
  if (path.startsWith('/api/admin/')) return send({ items: [], total: 0, page: 1, limit: 20 });
  if (path.startsWith('/api/exercises')) {
    const id = path.split('/').at(-1); if (exercises.some(e => e._id === id)) return send(exercises.find(e => e._id === id));
    return send({ exercises, page: 1, limit: 20, total: exercises.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  }
  if (path === '/api/workout-sessions/me') return send(sessions);
  if (path.startsWith('/api/workout-sessions/')) { const id = path.split('/')[3]; const session = sessions.find(s => s._id === id); if (method === 'DELETE') { sessions = sessions.filter(s => s._id !== id); return send(session); } return send(session); }
  if (path.includes('/workout-templates')) {
    if (method === 'POST' && !path.endsWith('/start')) { const template = { ...body, _id: '0123456789abcdef01234580', createdBy: user._id, isPublic: false, exercises: draft?.exercises.map((e, order) => ({ exercise: exercises.find(x => x._id === e.exerciseId), exerciseName: e.exerciseName, order, training: e.training, plannedSets: e.sets })) ?? [] }; templates.push(template); return send(template); }
    return send(templates);
  }
  if (path === '/api/workout-drafts/current') return send(draft && ['active', 'building'].includes(draft.status) ? draft : null);
  if (path.startsWith('/api/workout-drafts/')) {
    if (!draft) return send({ message: 'Not found' }, 404);
    if (method === 'GET') return send(draft);
    if (path.endsWith('/sets')) { draft.exercises = draft.exercises.map(e => e.exerciseId === body.exerciseId ? { ...e, sets: body.sets.map(s => ({ ...s, weight: s.weight === null || s.weight === '' ? null : Number(s.weight), reps: s.reps === null || s.reps === '' ? null : Number(s.reps) })) } : e); return send(draft); }
    if (path.endsWith('/training')) { draft.exercises = draft.exercises.map(e => e.exerciseId === body.exerciseId ? { ...e, training: body.training, cardioCompletion: body.cardioCompletion } : e); return send(draft); }
    if (path.endsWith('/complete')) { const session = { _id: '0123456789abcdef01234590', userId: user._id, startedAt: draft.startedAt, endedAt: new Date().toISOString(), exercises: draft.exercises }; sessions.push(session); draft.status = 'completed'; draft.completedSessionId = session._id; return send(session); }
    if (path.endsWith('/abandon')) draft.status = 'abandoned';
    return send(draft);
  }
  return send({ message: 'Fixture route not found' }, 404);
});
server.listen(5107, '127.0.0.1', () => console.log('Native review fixtures listening on 127.0.0.1:5107'));
