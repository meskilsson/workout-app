import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import Modal from "../ui/modal/Modal";
import RestDurationForm from "./RestDurationForm";
import { useAuth } from "../../context/AuthContext";
import { saveRestDuration } from "../../utils/restTimerPreference";
import { motion, useAnimate } from "motion/react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { Play, Pause, RotateCcw, Timer, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { refreshRestAlertPreference, restAlertsEnabled, setRestAlertsEnabled } from "../../utils/restTimerAlerts";
import Icon from "../ui/icon/Icon";
import Button from "../ui/button/Button";
import styles from "./RestTimer.module.css";
import TimerAlertSettings from "./TimerAlertSettings";
import { useWebTimers } from "./WebTimerContext";
import { useSyncExternalStore } from "react";
import { timerPushFailed } from "../../services/timerPush";
import {
    formatCountdownMilliseconds,
    useRestTimerControls,
} from "@workout-app/shared/timer/rest";


export default function RestTimer() {
    useTranslation();
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
    const store = useWebTimers();
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
    const cardioActive = Object.values(snapshot.cardio).some(entry => entry.state.status === "running");
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!state.isRunning) return;
        const id = window.setInterval(() => setNow(Date.now()), 200);
        return () => window.clearInterval(id);
    }, [state.isRunning]);
    const [alertsEnabled, setAlertsEnabled] = useState(restAlertsEnabled);
    const [pushFailed, setPushFailed] = useState(timerPushFailed);
    useEffect(() => {
        const update = (event: Event) => {
            if (event.type === "storage" && (event as StorageEvent).key === "rest-timer-alerts") refreshRestAlertPreference();
            setAlertsEnabled(restAlertsEnabled());
        };
        window.addEventListener("storage", update);
        window.addEventListener("timer-alert-preference", update);
        const updatePush = () => setPushFailed(timerPushFailed());
        window.addEventListener("timer-push-status", updatePush);
        return () => { window.removeEventListener("timer-push-status", updatePush); window.removeEventListener("storage", update); window.removeEventListener("timer-alert-preference", update); };
    }, []);


    return (
        <section className={styles.timer}>
            <div className={styles.info}>
                {cardioActive ? <small role="status">{t("RestTimer.cardioSessionControlsItsWorkAndRestPhasesPause")}</small> : <>
                <span className={styles.label} role="status"><Icon icon={Timer} /> {t(state.timeLeft === 0 && !state.isRunning ? "timerAlerts.restFinished" : "RestTimer.rest")}</span>

                <motion.strong ref={scope} className={styles.time}>
                    {formatCountdownMilliseconds(state.isRunning && state.endTime !== null ? Math.min(state.timeLeft, Math.max(0, state.endTime - now)) : state.timeLeft)}
                </motion.strong></>}
            </div>
                <label className={styles.alertToggle}>
                    <input type="checkbox" checked={alertsEnabled} onChange={(event) => {
                        const value = event.target.checked;
                        setRestAlertsEnabled(value);
                        setAlertsEnabled(value);
                    }} /> {t("RestTimer.restAlerts")} {pushFailed && <small role="status">{t("timerAlerts.pushUnavailable")}</small>}</label>

            <div className={styles.controls}>
                <div className={styles.actions}>
                    {!cardioActive && <><Button
                        type="button"
                        variant="secondary"
                        onClick={state.isRunning ? pause : start}
                        className={styles.iconButton}
                        aria-label={state.isRunning ? t("RestTimer.pauseRestTimer") : t("RestTimer.startRestTimer")}
                    >
                        <Icon icon={state.isRunning ? Pause : Play} className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={reset}
                        className={styles.iconButton}
                        aria-label={t("RestTimer.resetRestTimer")}
                    >
                        <Icon icon={RotateCcw} className={styles.timerIcon} />
                    </Button></>}
                    <Button type="button" variant="secondary" className={styles.iconButton}
                        aria-label={t("RestTimer.setRestDuration")} onClick={() => {
                            setDurationOpen(true);
                        }}>
                        <Icon icon={SlidersHorizontal} className={styles.timerIcon} />
                    </Button>
                </div>
            </div>
            <Modal title={t("RestTimer.restDuration")} isOpen={durationOpen} onClose={() => setDurationOpen(false)}>
                {durationOpen && <TimerAlertSettings />}
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
