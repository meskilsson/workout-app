import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
    const media = window.matchMedia(query);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
}
// Motion's hook snapshots the preference on mount; subscribe so an open workout
// also respects changes to the device's accessibility setting.
export function useReducedMotion() {
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
