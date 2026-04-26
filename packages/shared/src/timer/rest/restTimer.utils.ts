export function secondsToMilliseconds(seconds: number): number {
    return seconds * 1000;
}

export function formatCountdownMilliseconds(milliseconds: number): string {
    if (!Number.isFinite(milliseconds)) {
        return "00:00";
    }

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}