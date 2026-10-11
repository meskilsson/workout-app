import { t } from "../i18n";
const sessionKey = "workout-auth-session";
export const sessionExpiredEvent = "workout-session-expired";
let generation = 0;
let refresh: Promise<boolean> | undefined;
let expired = false;

export function hasSavedSession() {
    try { return localStorage.getItem(sessionKey) === "1"; } catch { return false; }
}
export function rememberSession() {
    try { localStorage.setItem(sessionKey, "1"); } catch { /* Storage is optional. */ }
}
export async function waitForSessionRenewal() {
    await refresh?.catch(() => undefined);
}
export function setSessionActive(active: boolean) {
    generation++;
    expired = false;
    try {
        if (active) localStorage.setItem(sessionKey, "1");
        else localStorage.removeItem(sessionKey);
    } catch { /* Cookies remain the source of authentication. */ }
}
function notifyExpired() {
    if (expired || !hasSavedSession()) return;
    expired = true;
    if (typeof window !== "undefined") window.dispatchEvent(new Event(sessionExpiredEvent));
}

async function renew(url: string): Promise<boolean> {
    const base = url.slice(0, url.indexOf("/api/"));
    const perform = async () => {
        // Another tab may have renewed while this tab waited for the lock.
        const probe = await fetch(`${base}/api/auth/me`, { credentials: "include", signal: AbortSignal.timeout(10000) });
        if (probe.ok) return true;
        if (probe.status !== 401) throw new Error(t("auth.sessionUnavailable"));
        const response = await fetch(`${base}/api/auth/refresh`, {
            method: "POST", credentials: "include", headers: { "X-Auth-Refresh": "1" },
            signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) return false;
        if (!response.ok) throw new Error(t("auth.sessionUnavailable"));
        return true;
    };
    return typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request("workout-auth-refresh", perform) : perform();
}

/** Retry an authenticated request once, only after an authentication rejection. */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const requestGeneration = generation;
    const response = await fetch(url, options);
    if (response.status !== 401 || options.credentials !== "include"
        || !url.includes("/api/") || /\/auth\/(login|logout|refresh)(?:\?|$)/.test(url)) return response;
    options.signal?.throwIfAborted();
    if (requestGeneration !== generation) throw new DOMException("Session changed", "AbortError");
    if (!refresh) refresh = renew(url).finally(() => { refresh = undefined; });
    const renewed = await refresh;
    options.signal?.throwIfAborted();
    if (requestGeneration !== generation) throw new DOMException("Session changed", "AbortError");
    if (!renewed) { notifyExpired(); return response; }
    const retried = await fetch(url, options);
    if (retried.status === 401 && requestGeneration === generation) notifyExpired();
    return retried;
}
