import { useEffect, useRef, useState } from "react";
import { validateCardioCompletion, createCardioTimer, isCardioTimerState, reconcileCardioTimer, cardioTimerAction, cardioTimerView, cardioCompletion, trainingTotalSeconds, formatTrainingSeconds, type TrainingConfig, type CardioCompletion, type CardioTimerState } from "@workout-app/shared";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";
import { readCardioSnapshot, saveCardioSnapshot } from "../../utils/workoutProgressStorage";
import Button from "../ui/button/Button";
import styles from "./Training.module.css";
export const CARDIO_START = "cardio-session-start";
export const CARDIO_ACTIVE = "cardio-session-active";
export default function CardioSession({ scope, exerciseId, config, completion, onCompletion }: { scope: string; exerciseId: string; config: TrainingConfig; completion?: CardioCompletion; onCompletion: (result: CardioCompletion | undefined) => void }) {
    const { reset: resetRest } = useRestTimerControls();
    const [state, setState] = useState<CardioTimerState>(() => {
        const saved = readCardioSnapshot(scope, exerciseId) as { config?: TrainingConfig; state?: unknown } | null;
        if (saved && JSON.stringify(saved.config) === JSON.stringify(config) && isCardioTimerState(saved.state)
            && saved.state.elapsedMs <= trainingTotalSeconds(config) * 1000) {
            try { if (saved.state.status === "completed") validateCardioCompletion(cardioCompletion(saved.state, config), config);
                return reconcileCardioTimer(saved.state, config, Date.now());
            } catch { /* An invalid snapshot must never mark cardio complete. */ }
        }
        return completion ? { status: "completed", elapsedMs: completion.elapsedSeconds * 1000, startedAt: null, manual: completion.manual } : createCardioTimer();
    });
    const current = useRef(state), callback = useRef(onCompletion);
    useEffect(() => { callback.current = onCompletion; }, [onCompletion]);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        current.current = state;
        saveCardioSnapshot(scope, exerciseId, { config, state });
        callback.current(cardioCompletion(state, config));
    }, [state, config, scope, exerciseId]);
    useEffect(() => {
        function pauseOther(event: Event) {
            if ((event as CustomEvent<string>).detail !== exerciseId) {
                const next = cardioTimerAction(current.current, config, "pause", Date.now());
                current.current = next; setState(next);
            }
        }
        window.addEventListener(CARDIO_START, pauseOther);
        return () => window.removeEventListener(CARDIO_START, pauseOther);
    }, [exerciseId, config]);
    useEffect(() => {
        if (state.status !== "running") return;
        resetRest();
        window.dispatchEvent(new CustomEvent(CARDIO_ACTIVE, { detail: true }));
        function tick() {
            const timestamp = Date.now();
            const next = reconcileCardioTimer(current.current, config, timestamp);
            current.current = next; setState(next); setNow(timestamp);
        }
        const id = window.setInterval(tick, 200);
        document.addEventListener("visibilitychange", tick);
        window.addEventListener("focus", tick);
        return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); window.removeEventListener("focus", tick); window.dispatchEvent(new CustomEvent(CARDIO_ACTIVE, { detail: false })); };
    }, [state.status, config, resetRest]);
    function action(action: "start" | "pause" | "resume" | "reset" | "complete") {
        const timestamp = Date.now();
        if (action === "start" || action === "resume") window.dispatchEvent(new CustomEvent(CARDIO_START, { detail: exerciseId }));
        const next = cardioTimerAction(current.current, config, action, timestamp);
        current.current = next; setState(next); setNow(timestamp);
    }
    const view = cardioTimerView(state, config, now);
    return <div className={styles.session}>
        <p role="status" aria-live="polite" aria-atomic="true">{view.phase}{config.format === "intervals" ? ` · Round ${view.round} of ${config.rounds}` : " · Continuous cardio"}</p>
        <strong className={styles.countdown} aria-label="Phase countdown">{formatTrainingSeconds(view.phaseRemaining)}</strong>
        <p>Session remaining: {formatTrainingSeconds(view.remaining)}</p>
        {config.format === "intervals" && <><progress max={config.rounds} value={view.completedRounds} aria-label="Completed rounds" /><p>{view.completedRounds} of {config.rounds} rounds completed</p></>}
        <div className={styles.controls}>
            {state.status === "ready" && <Button type="button" onClick={() => action("start")}>Start cardio</Button>}
            {state.status === "running" && <Button type="button" onClick={() => action("pause")}>Pause</Button>}
            {state.status === "paused" && <Button type="button" onClick={() => action("resume")}>Resume</Button>}
            <Button type="button" variant="secondary" onClick={() => action("reset")} disabled={state.status === "ready"}>Reset session</Button>
            <Button type="button" variant="secondary" onClick={() => action("complete")} disabled={state.status === "completed"}>Complete manually</Button>
        </div>
        {state.status === "completed" && <p>{state.manual ? "Completed manually" : "Planned session completed"} · Actual time: {formatTrainingSeconds(view.elapsed)}</p>}
    </div>;
}
