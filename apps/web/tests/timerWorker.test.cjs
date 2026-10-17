const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
async function receive({ authority, claimed = false, expired = false, blocked = false } = {}) {
    const values = new Map(), notifications = [], listeners = {};
    if (authority) values.set('scope:workout', authority);
    if (claimed) values.set('event', Date.now());
    const db = { close() {}, createObjectStore() {}, transaction() {
        const tx = { objectStore() { return {
            get(key) { const request = {}; queueMicrotask(() => { request.result = values.get(key); request.onsuccess?.(); queueMicrotask(() => tx.oncomplete?.()); }); return request; },
            put(value, key) { values.set(key, value); },
        }; } }; return tx;
    } };
    const context = { self: { addEventListener(name, callback) { listeners[name] = callback; }, registration: { async showNotification(title, options) { notifications.push({ title, ...options }); } } },
        Date, URL, indexedDB: { open() { if (blocked) throw Error('blocked'); const request = { result: db }; queueMicrotask(() => request.onsuccess()); return request; } } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/timer-sw.js'), 'utf8'), context);
    const payload = { id: 'event', scope: 'workout', revision: 10, title: 'Workout timer', body: 'Rest is over.', expiredBody: 'Open your workout.', expiresAt: Date.now() + (expired ? -1000 : 5000), url: '/workout/0123456789abcdef01234567' };
    let pending;
    listeners.push({ data: { json: () => payload }, waitUntil(promise) { pending = promise; } });
    await pending; return notifications;
}
test('fresh push shows a visible notification and claims its audible event', async () => {
    const notifications = await receive(); assert.equal(notifications.length, 1); assert.equal(notifications[0].silent, false); assert.equal(notifications[0].body, 'Rest is over.');
});
test('cancelled/replaced/expired in-flight push is silent with neutral wording', async () => {
    for (const options of [{ authority: { revision: 11, active: true } }, { authority: { revision: 10, active: false } }, { expired: true }]) {
        const notifications = await receive(options); assert.equal(notifications.length, 1); assert.equal(notifications[0].silent, true); assert.equal(notifications[0].body, 'Open your workout.');
    }
});
test('foreground-claimed push does not play a second system cue; storage failure remains visible and silent', async () => {
    for (const options of [{ claimed: true }, { blocked: true }]) {
        const notifications = await receive(options); assert.equal(notifications.length, 1); assert.equal(notifications[0].silent, true);
    }
});
