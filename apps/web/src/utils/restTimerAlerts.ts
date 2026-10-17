const PREFERENCE_KEY = "rest-timer-alerts";
let enabled: boolean | undefined;
let audioContext: AudioContext | undefined;
const voices = new Set<OscillatorNode>();

export function cancelTimerAudio(): void {
    for (const voice of voices) { try { voice.stop(); voice.disconnect(); } catch { /* Already ended. */ } }
    voices.clear();
}

export function timerAudioReady(): boolean { return audioContext?.state === "running"; }

export function restAlertsEnabled(): boolean {
    if (enabled === undefined) {
        try { enabled = localStorage.getItem(PREFERENCE_KEY) !== "off"; }
        catch { enabled = true; }
    }
    return enabled;
}

export function refreshRestAlertPreference(): void {
    try { enabled = localStorage.getItem(PREFERENCE_KEY) !== "off"; }
    catch { /* Keep the current in-memory choice if storage is unavailable. */ }
}

export function setRestAlertsEnabled(value: boolean): void {
    enabled = value;
    try { localStorage.setItem(PREFERENCE_KEY, value ? "on" : "off"); }
    catch { /* Keep the preference in memory if storage is blocked. */ }
    if (!value) cancelTimerAudio();
    if (typeof window.dispatchEvent === "function") window.dispatchEvent(new Event("timer-alert-preference"));
    if (value) prepareRestAlertAudio();
}

// Call during a user gesture, including completing a set that starts rest.
export function prepareRestAlertAudio(): void {
    if (!restAlertsEnabled()) return;
    try {
        const AudioContextClass = window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioContext || audioContext.state === "closed") { cancelTimerAudio(); audioContext = new AudioContextClass(); }
        audioContext.onstatechange = () => {
            if (audioContext?.state !== "running") cancelTimerAudio();
            if (typeof window.dispatchEvent === "function") window.dispatchEvent(new Event("timer-audio-state"));
        };
        if (audioContext.state !== "running" && audioContext.state !== "closed") void audioContext.resume().catch(() => {});
    } catch { /* Audio is optional on browsers that block it. */ }
}

export function playRestCompleteAlert(): void {
    playTimerCue("rest-end");
}

export function playTimerCue(cue: "rest-end" | "work-end" | "activity-end"): void {
    if (!restAlertsEnabled()) return;
    try { navigator.vibrate?.(100); } catch { /* Vibration may be unavailable. */ }
    // Do not resume here: completion is not a user gesture, and a suspended
    // context could otherwise queue a stale beep for the next interaction.
    if (!audioContext || audioContext.state !== "running") return;
    cancelTimerAudio();
    try {
        const now = audioContext.currentTime;
        const root = cue === "work-end" ? 660 : cue === "activity-end" ? 1100 : 880;
        // A soft rising chime, repeated twice. This is synthesized, not an Apple
        // recording. Schedule against the audio clock so cancellation stops both
        // repetitions without leaving a delayed JavaScript callback behind.
        for (const repeat of [0, 0.5]) {
            for (const [offset, frequency] of [[0, root], [0.12, root * 1.5]] as const) {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const start = now + repeat + offset;
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(frequency, start);
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.07, start + 0.012);
                gain.gain.linearRampToValueAtTime(0.025, start + 0.09);
                gain.gain.linearRampToValueAtTime(0, start + 0.28);
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                voices.add(oscillator);
                oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
                oscillator.start(start);
                oscillator.stop(start + 0.28);
            }
        }
    } catch { cancelTimerAudio(); /* Failure to alert must not interrupt the timer. */ }
}
