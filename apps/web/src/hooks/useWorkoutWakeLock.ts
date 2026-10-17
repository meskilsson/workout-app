import { useEffect, useState } from 'react';

export function screenWakePreference(): boolean {
    try { return localStorage.getItem('workout-screen-awake') === 'on'; } catch { return false; }
}
let awake = false;
export function screenIsAwake() { return awake; }
export function setScreenWakePreference(value: boolean) {
    try { localStorage.setItem('workout-screen-awake', value ? 'on' : 'off'); } catch { /* Optional preference. */ }
    window.dispatchEvent(new Event('timer-wake-preference'));
}

// Owned above the routes so closing settings or navigating doesn't release it.
export function useWorkoutWakeLock(scope: string | null) {
    const [enabled, setEnabled] = useState(screenWakePreference);
    useEffect(() => {
        const update = () => setEnabled(screenWakePreference());
        window.addEventListener('timer-wake-preference', update);
        window.addEventListener('storage', update);
        return () => { window.removeEventListener('timer-wake-preference', update); window.removeEventListener('storage', update); };
    }, []);
    useEffect(() => {
        if (!scope || !enabled || !('wakeLock' in navigator)) return;
        let lock: WakeLockSentinel | undefined;
        let disposed = false, requesting = false;
        const status = (value: boolean) => { awake = value; window.dispatchEvent(new Event('timer-wake-status')); };
        const acquire = async () => {
            if (disposed || requesting || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
            requesting = true;
            try {
                const result = await navigator.wakeLock.request('screen');
                if (disposed) { await result.release(); return; }
                lock = result; status(true);
                result.addEventListener('release', () => { if (!disposed) status(false); });
            } catch { if (!disposed) status(false); }
            finally { requesting = false; }
        };
        const visibility = () => {
            if (document.visibilityState === 'visible') void acquire();
            else { void lock?.release(); status(false); }
        };
        void acquire(); document.addEventListener('visibilitychange', visibility);
        return () => { disposed = true; document.removeEventListener('visibilitychange', visibility); void lock?.release(); status(false); };
    }, [scope, enabled]);
}
