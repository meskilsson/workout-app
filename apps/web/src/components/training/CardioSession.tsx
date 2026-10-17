import { displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createCardioTimer, reconcileCardioTimer, cardioTimerView, formatTrainingSeconds, type TrainingConfig, type CardioCompletion } from "@workout-app/shared";
import { useWebTimers } from "../timer/WebTimerContext";
import { cancelTimerAudio, prepareRestAlertAudio } from "../../utils/restTimerAlerts";
import Modal from "../ui/modal/Modal";
import TrainingConfigForm from "./TrainingConfigForm";
import Button from "../ui/button/Button";
import styles from "./Training.module.css";
export default function CardioSession({ scope, exerciseId, config, completion, onConfig, disabled = false }: { disabled?: boolean; onConfig?: (config: TrainingConfig) => Promise<void>; scope: string; exerciseId: string; config: TrainingConfig; completion?: CardioCompletion }) {
    useTranslation();
    const [options, setOptions] = useState<"cardio" | "intervals" | null>(null);
    const [savingOptions, setSavingOptions] = useState(false);
    const store = useWebTimers();
    const empty = useMemo(createCardioTimer, []);
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
    const state = snapshot.cardio[exerciseId]?.state ?? empty;
    useEffect(() => {
        if (scope === store.scope) void store.register(exerciseId, config, completion);
    }, [store, scope, exerciseId, config, completion]);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (state.status !== "running") return;
        const tick = () => setNow(Date.now());
        tick();
        const id = window.setInterval(tick, 200);
        return () => window.clearInterval(id);
    }, [state.status]);
    function action(action: "start" | "pause" | "resume" | "reset" | "complete") {
        prepareRestAlertAudio();
        cancelTimerAudio();
        void store.cardioAction(exerciseId, action);
        setNow(Date.now());
    }
    const view = cardioTimerView(reconcileCardioTimer(state, config, now), config, now);
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
