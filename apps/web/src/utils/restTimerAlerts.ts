const PREFERENCE_KEY = "rest-timer-alerts";
let enabled: boolean | undefined;
let audioContext: AudioContext | undefined;

export function restAlertsEnabled(): boolean {
    if (enabled === undefined) {
        try { enabled = localStorage.getItem(PREFERENCE_KEY) !== "off"; }
        catch { enabled = true; }
    }
    return enabled;
}

export function setRestAlertsEnabled(value: boolean): void {
    enabled = value;
    try { localStorage.setItem(PREFERENCE_KEY, value ? "on" : "off"); }
    catch { /* Keep the preference in memory if storage is blocked. */ }
    if (value) prepareRestAlertAudio();
}

// Call during a user gesture, including completing a set that starts rest.
export function prepareRestAlertAudio(): void {
    if (!restAlertsEnabled()) return;
    try {
        const AudioContextClass = window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContext ??= new AudioContextClass();
        if (audioContext.state === "suspended") void audioContext.resume().catch(() => {});
    } catch { /* Audio is optional on browsers that block it. */ }
}

export function playRestCompleteAlert(): void {
    if (!restAlertsEnabled()) return;
    try { navigator.vibrate?.(100); } catch { /* Vibration may be unavailable. */ }
    // Do not resume here: completion is not a user gesture, and a suspended
    // context could otherwise queue a stale beep for the next interaction.
    if (!audioContext || audioContext.state !== "running") return;
    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.26);
    } catch { /* Failure to alert must not interrupt the timer. */ }
}
