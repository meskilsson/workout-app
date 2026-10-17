import { apiFetch } from '../utils/apiFetch';
import type { TimerEvent } from '../utils/timerTimeline';
import { timerIdentity } from '../utils/timerIdentity';
const base = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/timer-push`;
let memoryDevice: string | undefined;
let failed = false;
export function timerPushFailed() { return failed; }
export function setTimerPushFailed(value: boolean) {
    failed = value;
    window.dispatchEvent(new Event('timer-push-status'));
}
export function timerDeviceId(): string {
    try {
        let value = localStorage.getItem('timer-device-id');
        if (!value || !/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value)) { value = timerIdentity(); localStorage.setItem('timer-device-id', value); }
        return value;
    } catch { return memoryDevice ??= timerIdentity(); }
}
export async function timerPushRequest(path: string, body?: unknown) {
    const response = await apiFetch(base + path, { credentials: 'include', method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Timer notification request failed');
    return response.json();
}
export function pushPreference(userId: string): boolean {
    try { return localStorage.getItem(`timer-push:${userId}`) === 'on'; } catch { return false; }
}
export function savePushPreference(userId: string, enabled: boolean) {
    try { localStorage.setItem(`timer-push:${userId}`, enabled ? 'on' : 'off'); } catch { /* Optional storage. */ }
    window.dispatchEvent(new Event('timer-push-preference'));
}
export async function syncTimerPush(draftId: string, revision: number, events: TimerEvent[], language: string) {
    return timerPushRequest('/schedule', { deviceId: timerDeviceId(), draftId, revision, events, language });
}
export async function cancelDeviceTimerPush() {
    await timerPushRequest('/disable', { deviceId: timerDeviceId() });
}
export function registerTimerWorker() { return navigator.serviceWorker.register('/timer-sw.js', { scope: '/' }); }
export async function dismissTimerNotifications(validIds: string[] = []) {
    try {
        const registration = await navigator.serviceWorker?.getRegistration();
        const notifications = await registration?.getNotifications();
        notifications?.forEach(notification => { if (notification.tag.startsWith('timer:') && !validIds.includes(notification.tag.slice(6))) notification.close(); });
    } catch { /* Notification APIs are optional. */ }
}
