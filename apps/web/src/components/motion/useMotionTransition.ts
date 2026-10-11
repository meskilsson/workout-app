import { useReducedMotion } from "./useReducedMotion";

export function useMotionTransition(duration = 0.2) {
    const reduced = useReducedMotion();
    return { duration: reduced ? 0 : duration, ease: [0.25, 0.1, 0.25, 1] as const };
}
