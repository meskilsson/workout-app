import Modal from "../ui/modal/Modal";
import RestDurationForm from "./RestDurationForm";
import { useAuth } from "../../context/AuthContext";
import { saveRestDuration } from "../../utils/restTimerPreference";
import { motion, useAnimate } from "motion/react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { Play, Pause, RotateCcw, Timer, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { restAlertsEnabled, setRestAlertsEnabled } from "../../utils/restTimerAlerts";
import Icon from "../ui/icon/Icon";
import Button from "../ui/button/Button";
import styles from "./RestTimer.module.css";
import {
    formatCountdownMilliseconds,
    useRestTimerControls,
} from "@workout-app/shared/timer/rest";


export default function RestTimer() {
    const reduced = useReducedMotion();
    const [scope, animate] = useAnimate<HTMLElement>();
    useEffect(() => {
        if (reduced && scope.current) void animate(scope.current, { scale: 1 }, { duration: 0 });
        const finished = () => { if (!reduced && scope.current) void animate(scope.current, { scale: [1, 1.025, 1] }, { duration: 0.4 }); };
        window.addEventListener("rest-timer-completed", finished);
        return () => window.removeEventListener("rest-timer-completed", finished);
    }, [animate, reduced, scope]);
    const { state, start, pause, reset, setDuration } = useRestTimerControls();
    const { user } = useAuth();
    const [durationOpen, setDurationOpen] = useState(false);
    const [cardioActive, setCardioActive] = useState(false);
    useEffect(() => {
        const listener = (event: Event) => setCardioActive(Boolean((event as CustomEvent).detail));
        window.addEventListener("cardio-session-active", listener);
        return () => window.removeEventListener("cardio-session-active", listener);
    }, []);
    const [alertsEnabled, setAlertsEnabled] = useState(restAlertsEnabled);

    if (cardioActive) return <p role="status">Cardio session controls its work and rest phases. Pause cardio to use the manual rest timer.</p>;
    return (
        <section className={styles.timer}>
            <div className={styles.info}>
                <span className={styles.label}><Icon icon={Timer} /> Rest</span>

                <motion.strong ref={scope} className={styles.time}>
                    {formatCountdownMilliseconds(state.timeLeft)}
                </motion.strong>
            </div>
                <label className={styles.alertToggle}>
                    <input type="checkbox" checked={alertsEnabled} onChange={(event) => {
                        const value = event.target.checked;
                        setRestAlertsEnabled(value);
                        setAlertsEnabled(value);
                    }} />
                    Rest alerts
                </label>

            <div className={styles.controls}>
                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={state.isRunning ? pause : start}
                        className={styles.iconButton}
                        aria-label={state.isRunning ? "Pause rest timer" : "Start rest timer"}
                    >
                        <Icon icon={state.isRunning ? Pause : Play} className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={reset}
                        className={styles.iconButton}
                        aria-label="Reset rest timer"
                    >
                        <Icon icon={RotateCcw} className={styles.timerIcon} />
                    </Button>
                    <Button type="button" variant="secondary" className={styles.iconButton}
                        aria-label="Set rest duration" onClick={() => {
                            setDurationOpen(true);
                        }}>
                        <Icon icon={SlidersHorizontal} className={styles.timerIcon} />
                    </Button>
                </div>
            </div>
            <Modal title="Rest duration" isOpen={durationOpen} onClose={() => setDurationOpen(false)}>
                {durationOpen && <RestDurationForm duration={state.duration} disabled={!user}
                    onCancel={() => setDurationOpen(false)} onSave={durationMs => {
                        if (!user) return;
                        saveRestDuration(user._id, durationMs);
                        setDuration(durationMs);
                        setDurationOpen(false);
                    }} /> }
            </Modal>
        </section>
    );
}
