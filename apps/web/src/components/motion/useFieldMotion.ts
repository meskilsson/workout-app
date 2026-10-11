import { useState } from "react";
import type { TargetAndTransition } from "motion/react";
import { useMotionTransition } from "./useMotionTransition";

// Keep mouse/touch focus feedback as well as keyboard focus feedback.
export function useFieldMotion(duration = 0.2) {
    const [focused, setFocused] = useState<string | null>(null);
    const transition = useMotionTransition(duration);
    return (id: string, rest: TargetAndTransition, focus: TargetAndTransition, hover?: TargetAndTransition) => ({
        initial: false as const,
        animate: focused === id ? { ...rest, ...focus } : rest,
        whileHover: focused === id ? { ...rest, ...hover, ...focus } : hover,
        onFocusCapture: () => setFocused(id),
        onBlurCapture: () => setFocused(null),
        transition,
    });
}
