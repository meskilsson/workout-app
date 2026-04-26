export default function formatDuration(startedAt?: string | null, endedAt?: string) {
    if (!startedAt || !endedAt) return "—";

    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
        return "—";
    }

    const totalSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
