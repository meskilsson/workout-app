import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useAnimate } from "motion/react";
import { useReducedMotion } from "./useReducedMotion";

import { LoadingRegistration } from "./useLoadingHandoff";

export function LoadingHandoff({ children, className }: { children: ReactNode; className?: string }) {
    const [scope, animate] = useAnimate<HTMLElement>();
    const reduced = useReducedMotion();
    const count = useRef(0);
    const frame = useRef(0);
    const register = useCallback(() => {
        count.current += 1;
        cancelAnimationFrame(frame.current);
        const path = window.location.pathname;
        return () => {
            count.current -= 1;
            frame.current = requestAnimationFrame(() => {
                if (!count.current && scope.current && path === window.location.pathname && !reduced) {
                    void animate(scope.current, { opacity: [0.85, 1] }, { duration: 0.16 });
                }
            });
        };
    }, [animate, reduced, scope]);
    useLayoutEffect(() => () => cancelAnimationFrame(frame.current), []);
    return <LoadingRegistration.Provider value={register}><motion.main ref={scope} id="main-content" tabIndex={-1} className={className}>{children}</motion.main></LoadingRegistration.Provider>;
}
