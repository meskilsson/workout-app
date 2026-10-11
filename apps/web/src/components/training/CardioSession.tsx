import { displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { validateCardioCompletion, createCardioTimer, isCardioTimerState, reconcileCardioTimer, cardioTimerAction, cardioTimerView, cardioCompletion, trainingTotalSeconds, formatTrainingSeconds, type TrainingConfig, type CardioCompletion, type CardioTimerState } from "@workout-app/shared";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";
import { readCardioSnapshot, saveCardioSnapshot } from "../../utils/workoutProgressStorage";
import Modal from "../ui/modal/Modal";
import TrainingConfigForm from "./TrainingConfigForm";
import Button from "../ui/button/Button";
import styles from "./Training.module.css";
export const CARDIO_START = "cardio-session-start";
export const CARDIO_ACTIVE = "cardio-session-active";
export default function CardioSession({ scope, exerciseId, config, completion, onCompletion, onConfig, disabled = false }: { disabled?: boolean; onConfig?: (config: TrainingConfig) => Promise<void>; scope: string; exerciseId: string; config: TrainingConfig; completion?: CardioCompletion; onCompletion: (result: CardioCompletion | undefined) => void }) {
    useTranslation();
    const [options, setOptions] = useState<"cardio" | "intervals" | null>(null);
    const [savingOptions, setSavingOptions] = useState(false);
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
        <p role="status" aria-live="polite" aria-atomic="true">{displayValue(view.phase)}{config.format === "intervals" ? t("CardioSession.roundValueOfValue", { value0: view.round, value1: config.rounds }) : t("CardioSession.continuousCardio")}</p>
        <strong className={styles.countdown} aria-label={t("CardioSession.phaseCountdown")}>{formatTrainingSeconds(view.phaseRemaining)}</strong>
        <p>{t("CardioSession.sessionRemaining")} {formatTrainingSeconds(view.remaining)}</p>
        {config.format === "intervals" && <><progress max={config.rounds} value={view.completedRounds} aria-label={t("CardioSession.completedRounds")} /><p>{view.completedRounds} {t("common.of")} {config.rounds} {t("CardioSession.roundsCompleted")}</p></>}
        {onConfig && <div className={styles.controls}>
            <Button type="button" variant="ghost" disabled={disabled || state.status !== "ready"} onClick={() => setOptions("cardio")}>{t("CardioSession.durationAmpDistance")}</Button>
            <Button type="button" variant="ghost" disabled={disabled || state.status !== "ready"} onClick={() => setOptions("intervals")}>{t("common.intervals")}</Button>
        </div>}
        <div className={styles.controls}>
            {state.status === "ready" && <Button type="button" disabled={disabled} onClick={() => action("start")}>{t("CardioSession.startCardio")}</Button>}
            {state.status === "running" && <Button type="button" disabled={disabled} onClick={() => action("pause")}>{t("CardioSession.pause")}</Button>}
            {state.status === "paused" && <Button type="button" disabled={disabled} onClick={() => action("resume")}>{t("CardioSession.resume")}</Button>}
            <Button type="button" variant="secondary" onClick={() => action("reset")} disabled={disabled || state.status === "ready"}>{t("CardioSession.resetSession")}</Button>
            <Button type="button" variant="secondary" onClick={() => action("complete")} disabled={disabled || state.status === "completed"}>{t("CardioSession.completeManually")}</Button>
        </div>
        {options && onConfig && <Modal title={options === "intervals" ? t("common.intervals") : t("CardioSession.durationDistance")} isOpen onClose={() => { if (!savingOptions) setOptions(null); }}>
            <p>{t("CardioSession.changesApplyBeforeStartingResetTheActivityFirstTo")}</p>
            <TrainingConfigForm cardioOnly initialMode={options} initial={config} onDirty={() => {}} onSave={async next => {
                if (disabled) return;
                setSavingOptions(true);
                try { await onConfig(next); setOptions(null); }
                finally { setSavingOptions(false); }
            }} />
            <Button type="button" variant="ghost" disabled={savingOptions} onClick={() => setOptions(null)}>{t("common.cancel")}</Button>
        </Modal>}
        {state.status === "completed" && <p>{state.manual ? t("CardioSession.completedManually") : t("CardioSession.plannedSessionCompleted")} {t("CardioSession.actualTime")} {formatTrainingSeconds(view.elapsed)}</p>}
    </div>;
}
