import { PersonStanding } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { useReducedMotion } from "../../components/motion/useReducedMotion";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useAnimate, useIsPresent } from "motion/react";
import Button from "../../components/ui/button/Button";
import styles from "./WorkoutPage.module.css";

const duration = 0.45;
export function CompletedSetRow({ completed, children }: { completed: boolean; children: ReactNode }) {
    useTranslation();
    const reduced = useReducedMotion();
    const present = useIsPresent();
    return <motion.div layout="position" initial={{ opacity: 0, height: reduced ? "auto" : 0, y: reduced ? 0 : -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: reduced ? "auto" : 0, y: reduced ? 0 : -4, marginBottom: reduced ? 0 : "calc(-1 * var(--space-3))" }} transition={{ duration: reduced ? 0 : 0.2 }} inert={!present} style={{ overflow: "hidden" }}>
        <div className={styles.setRow} data-completed={completed}>
        {children}
        </div>
    </motion.div>;
}

export function SetCompletionControl({ completed, onComplete, number, isWarmup, exerciseName, disabled }: {
    completed: boolean; onComplete: () => void; number: number; isWarmup: boolean; exerciseName: string; disabled: boolean;
}) {
    useTranslation();
    const reduced = useReducedMotion();
    const requested = useRef(false);
    const [scope, animate] = useAnimate<HTMLSpanElement>();
    useEffect(() => {
        if (!completed || !requested.current || reduced) {
            requested.current = false;
            void animate("[data-completion-ring]", { opacity: 0, scale: 1 }, { duration: 0 });
            void animate("svg", { scale: 1 }, { duration: 0 });
            return;
        }
        requested.current = false;
        const ring = animate("[data-completion-ring]", { opacity: [0, 0.45, 0], scale: [0.75, 1.45] }, { duration, ease: "easeOut" });
        const pop = animate("svg", { scale: [1, 1.16, 1] }, { duration, ease: "easeInOut" });
        return () => { ring.stop(); pop.stop(); };
    }, [completed, reduced, animate]);
    const label = t(completed ? (isWarmup ? "workout.restartWarmupRest" : "workout.restartSetRest") : isWarmup ? "workout.completeWarmup" : "workout.completeSet", { number, exercise: exerciseName });
    const incompleteColor = isWarmup ? "var(--color-warning-text)" : "var(--color-success-text)";
    return <Button type="button" variant="ghost" size="small" disabled={disabled} title={label}
        className={[styles.completeSetButton, completed ? styles.completedSetButton : ""].join(" ")}
        transition={{ duration: reduced ? 0 : 0.2, borderRadius: { duration: reduced ? 0 : duration, ease: [0.22, 1, 0.36, 1] } }}
        animate={{ borderRadius: completed || isWarmup ? 23 : 12, color: completed ? "var(--set-completion-text)" : incompleteColor,
            backgroundColor: completed ? "var(--set-completion-fill)" : "rgba(0, 0, 0, 0)",
            borderColor: completed ? "var(--color-set-completion-border, var(--set-completion-fill))" : incompleteColor }}
        whileHover={{ color: completed ? "var(--set-completion-text)" : incompleteColor,
            backgroundColor: completed ? "var(--set-completion-hover)" : "rgba(0, 0, 0, 0)",
            borderColor: completed ? "var(--color-set-completion-border, var(--set-completion-hover))" : incompleteColor, y: -1 }}
        onClick={() => { if (!completed) requested.current = true; onComplete(); }}
        aria-label={label} aria-pressed={completed}>
        <span ref={scope} className={styles.completionSymbol} aria-hidden="true">
            <motion.span data-completion-ring className={styles.completionRing} initial={{ opacity: 0 }} />
            <motion.span className={styles.setNumber} initial={false}
                animate={{ opacity: completed ? 0 : 1, scale: completed ? (reduced ? 1 : 0.75) : 1 }}
                transition={{ duration: reduced ? 0 : 0.2 }}>
                {isWarmup ? <Icon icon={PersonStanding} /> : number}
            </motion.span>
            <motion.svg key={String(reduced)} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <motion.path d="m20 6-11 11-5-5" initial={false}
                    animate={{ pathLength: completed ? 1 : 0, opacity: completed ? 1 : 0 }} transition={{ duration: reduced ? 0 : duration, ease: "easeInOut" }} />
            </motion.svg>
        </span>
    </Button>;
}
