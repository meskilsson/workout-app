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

export function SetCompletionControl({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
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
    return <Button type="button" variant="ghost" size="small"
        className={[styles.completeSetButton, completed ? styles.completedSetButton : ""].join(" ")}
        transition={{ duration: reduced ? 0 : 0.2, borderRadius: { duration: reduced ? 0 : duration, ease: [0.22, 1, 0.36, 1] } }}
        animate={{ borderRadius: completed ? 23 : 12, color: completed ? "var(--set-completion-text)" : "var(--color-success-text)",
            backgroundColor: completed ? "var(--set-completion-fill)" : "rgba(0, 0, 0, 0)",
            borderColor: completed ? "var(--color-set-completion-border, var(--set-completion-fill))" : "var(--color-success-text)" }}
        whileHover={{ color: completed ? "var(--set-completion-text)" : "var(--color-success-text)",
            backgroundColor: completed ? "var(--set-completion-hover)" : "rgba(0, 0, 0, 0)",
            borderColor: completed ? "var(--color-set-completion-border, var(--set-completion-hover))" : "var(--color-success-text)", y: -1 }}
        onClick={() => { if (!completed) requested.current = true; onComplete(); }}
        aria-label={completed ? t("SetCompletion.completedSetRestartRestTimer") : t("SetCompletion.completeSetAndStartRestTimer")} aria-pressed={completed}>
        <span ref={scope} className={styles.completionSymbol} aria-hidden="true">
            <motion.span data-completion-ring className={styles.completionRing} initial={{ opacity: 0 }} />
            <motion.svg key={String(reduced)} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <motion.circle cx="12" cy="12" r="10" initial={false}
                    animate={{ pathLength: completed ? 0 : 1, opacity: completed ? 0 : 1 }} transition={{ duration: reduced ? 0 : 0.3 }} />
                <motion.path d="m20 6-11 11-5-5" initial={false}
                    animate={{ pathLength: completed ? 1 : 0, opacity: completed ? 1 : 0 }} transition={{ duration: reduced ? 0 : duration, ease: "easeInOut" }} />
            </motion.svg>
        </span>
    </Button>;
}
