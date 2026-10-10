const { test } = require('node:test');
const assert = require('node:assert/strict');
const { workoutRequest } = require('../src/utils/workoutRequest.ts');

test('workout requests bound stalled connections and abort them', async () => {
    const original = global.fetch;
    let signal;
    global.fetch = async (_, options) => { signal = options.signal; return new Promise(() => {}); };
    try {
        await assert.rejects(workoutRequest('https://example.test', {}, 10), /timed out/);
        assert.equal(signal.aborted, true);
    } finally { global.fetch = original; }
});

test('deadline also covers a stalled response body', async () => {
    const original = global.fetch;
    global.fetch = async () => ({ arrayBuffer: () => new Promise(() => {}) });
    try { await assert.rejects(workoutRequest('https://example.test', {}, 10), /timed out/); }
    finally { global.fetch = original; }
});

test('responses retain status and JSON for existing API error handling', async () => {
    const original = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ message: 'Not active' }), { status: 409 });
    try {
        const response = await workoutRequest('https://example.test', {}, 100);
        assert.equal(response.status, 409);
        assert.deepEqual(await response.json(), { message: 'Not active' });
    } finally { global.fetch = original; }
});
