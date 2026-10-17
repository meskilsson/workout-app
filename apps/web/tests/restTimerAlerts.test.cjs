const { test } = require('node:test');
const assert = require('node:assert/strict');
const alerts = require('../src/utils/restTimerAlerts.ts');

test('rest alerts play two chimes, cancel both repeats, obey mute, and skip suspended audio', () => {
    const originals = Object.fromEntries(['window', 'navigator', 'localStorage'].map(
        key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const values = new Map();
    const vibrations = [];
    const stops = [];
    const starts = [];
    const frequencies = [];
    let resumes = 0;
    let context;
    class MockAudioContext {
        state = 'suspended';
        currentTime = 10;
        destination = {};
        constructor() { context = this; }
        resume() { resumes++; this.state = 'running'; return Promise.resolve(); }
        createOscillator() {
            return { frequency: { setValueAtTime(value) { frequencies.push(value); } }, connect() {}, disconnect() {},
                start(at) { starts.push(at); }, stop(at) { stops.push(at); } };
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
        assert.deepEqual(starts, [10, 10.12, 10.5, 10.62]);
        assert.deepEqual(frequencies, [880, 1320, 880, 1320]);
        assert.equal(stops.length, 4);
        assert.ok(Math.abs(stops[3] - 10.9) < 0.00001);

        alerts.setRestAlertsEnabled(false);
        assert.equal(stops.filter(value => value === undefined).length, 4, 'muting cancels all scheduled notes, including the second chime');
        assert.equal(values.get('rest-timer-alerts'), 'off');
        alerts.playRestCompleteAlert();
        assert.equal(vibrations.length, 1);
        assert.equal(stops.length, 8);

        alerts.setRestAlertsEnabled(true);
        context.state = 'suspended';
        alerts.playRestCompleteAlert();
        assert.equal(stops.length, 8);
        assert.equal(resumes, 1, 'completion must not queue a delayed beep');
        context.state = 'interrupted';
        alerts.prepareRestAlertAudio();
        assert.equal(resumes, 2, 'a fresh gesture recovers interrupted Safari audio');

        alerts.playTimerCue('work-end');
        assert.deepEqual(frequencies.slice(-4), [660, 990, 660, 990]);
        alerts.playTimerCue('activity-end');
        assert.deepEqual(frequencies.slice(-4), [1100, 1650, 1100, 1650]);
        context.state = 'interrupted';
        context.onstatechange();
        assert.equal(alerts.timerAudioReady(), false);
        alerts.prepareRestAlertAudio();
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
        assert.doesNotThrow(() => alerts.playRestCompleteAlert());
        Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
            getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); },
        } });
        alerts.setRestAlertsEnabled(false);
        assert.equal(alerts.restAlertsEnabled(), false, 'blocked storage must preserve the in-memory mute choice');
    } finally {
        for (const [key, descriptor] of Object.entries(originals)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    }
});
