const defaultDuration = 120_000;
const maxDuration = 86_400_000;
function key(userId: string) { return `rest-duration:${encodeURIComponent(userId)}`; }
export function validRestDuration(duration: number) {
    return Number.isSafeInteger(duration) && duration >= 1000 && duration <= maxDuration && duration % 1000 === 0;
}
export function readRestDuration(userId?: string): number {
    if (!userId) return defaultDuration;
    try {
        const duration = JSON.parse(localStorage.getItem(key(userId)) ?? "null");
        return typeof duration === "number" && validRestDuration(duration) ? duration : defaultDuration;
    } catch { return defaultDuration; }
}
export function saveRestDuration(userId: string, duration: number) {
    if (!validRestDuration(duration)) return;
    try { localStorage.setItem(key(userId), JSON.stringify(duration)); } catch { /* Keep the active context when storage is unavailable. */ }
}

export function parseRestDuration(minutes: string, seconds: string): number | null {
    if (!/^\d{0,4}$/.test(minutes) || !/^\d{0,2}$/.test(seconds) || Number(seconds) > 59) return null;
    const duration = (Number(minutes) * 60 + Number(seconds)) * 1000;
    return validRestDuration(duration) ? duration : null;
}
