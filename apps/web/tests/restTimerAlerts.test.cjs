const { test } = require('node:test');
const assert = require('node:assert/strict');
const alerts = require('../src/utils/restTimerAlerts.ts');

test('rest alerts play a brief beep and vibration, obey mute, and skip suspended audio', () => {
    const originals = Object.fromEntries(['window', 'navigator', 'localStorage'].map(
        key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const values = new Map();
    const vibrations = [];
    const stops = [];
    let resumes = 0;
    let context;
    class MockAudioContext {
        state = 'suspended';
        currentTime = 10;
        destination = {};
        constructor() { context = this; }
        resume() { resumes++; this.state = 'running'; return Promise.resolve(); }
        createOscillator() {
            return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {},
                start() {}, stop(at) { stops.push(at); } };
        }
        createGain() {
            return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
                connect() {}, disconnect() {} };
        }
    }
    try {
        for (const [key, value] of Object.entries({
            window: { AudioContext: MockAudioContext },
            navigator: { vibrate: ms => vibrations.push(ms) },
            localStorage: { getItem: key => values.get(key) ?? null,
                setItem: (key, value) => values.set(key, value) },
        })) Object.defineProperty(globalThis, key, { configurable: true, value });

        assert.equal(alerts.restAlertsEnabled(), true);
        alerts.prepareRestAlertAudio();
        assert.equal(resumes, 1);
        alerts.playRestCompleteAlert();
        assert.deepEqual(vibrations, [100]);
        assert.deepEqual(stops, [10.26]);

        alerts.setRestAlertsEnabled(false);
        assert.equal(values.get('rest-timer-alerts'), 'off');
        alerts.playRestCompleteAlert();
        assert.equal(vibrations.length, 1);
        assert.equal(stops.length, 1);

        alerts.setRestAlertsEnabled(true);
        context.state = 'suspended';
        alerts.playRestCompleteAlert();
        assert.equal(stops.length, 1);
        assert.equal(resumes, 1, 'completion must not queue a delayed beep');

        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
        assert.doesNotThrow(() => alerts.playRestCompleteAlert());
    } finally {
        for (const [key, descriptor] of Object.entries(originals)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    }
});
