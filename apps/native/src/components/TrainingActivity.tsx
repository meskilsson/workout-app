import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, AppState, StyleSheet } from "react-native";
import { validateTraining, trainingTotalSeconds, formatTrainingSeconds, createCardioTimer, cardioTimerAction, reconcileCardioTimer, cardioTimerView, cardioCompletion, type TrainingConfig, type CardioCompletion } from "@workout-app/shared";
import Button from "./UI/Button/Button";
export default function TrainingActivity({ initial, building, activeId, exerciseId, onStart, onSave, onDirty }: { initial?: TrainingConfig; building: boolean; activeId: string | null; exerciseId: string; onStart: () => void; onSave: (training: TrainingConfig, completion?: CardioCompletion) => Promise<void>; onDirty: (dirty: boolean) => void }) {
    const config = initial ?? { format: "strength" };
    const [format, setFormat] = useState(config.format), [rounds, setRounds] = useState(String(config.format === "intervals" ? config.rounds : 8));
    const [workMin, setWorkMin] = useState(String(Math.floor((config.format === "intervals" ? config.workSeconds : config.format === "cardio" ? config.durationSeconds : 30) / 60)));
    const [workSec, setWorkSec] = useState(String((config.format === "intervals" ? config.workSeconds : config.format === "cardio" ? config.durationSeconds : 30) % 60));
    const [distance, setDistance] = useState(config.format === "cardio" && config.targetDistance ? String(config.targetDistance) : "");
    const [unit, setUnit] = useState<"km" | "mi" | "m">(config.format === "cardio" ? config.distanceUnit ?? "km" : "km");
    const [restMin, setRestMin] = useState(String(config.format === "intervals" ? Math.floor(config.restSeconds / 60) : 1));
    const [restSec, setRestSec] = useState(String(config.format === "intervals" ? config.restSeconds % 60 : 30));
    const [error, setError] = useState(""), [saving, setSaving] = useState(false), [dirty, setDirty] = useState(false);
    const [state, setState] = useState(createCardioTimer), [now, setNow] = useState(Date.now);
    const current = useRef(state);
    useEffect(() => { current.current = state; }, [state]);
    useEffect(() => {
        if (activeId !== exerciseId) { const next = cardioTimerAction(current.current, config, "pause", Date.now()); current.current = next; setState(next); }
    }, [activeId, exerciseId, config]);
    useEffect(() => {
        if (state.status !== "running") return;
        const tick = () => { const t = Date.now(); const next = reconcileCardioTimer(current.current, config, t); current.current = next; setState(next); setNow(t); };
        const id = setInterval(tick, 200), subscription = AppState.addEventListener("change", tick);
        return () => { clearInterval(id); subscription.remove(); };
    }, [state.status, config]);
    let candidate: TrainingConfig | undefined;
    try {
        if ([workMin, workSec, restMin, restSec].some(v => v === "" || !/^\d+$/.test(v)) || Number(workSec) > 59 || Number(restSec) > 59) throw new Error("Invalid minutes or seconds");
        candidate = validateTraining(format === "strength" ? { format } : format === "cardio" ? { format, durationSeconds: Number(workMin) * 60 + Number(workSec), ...(distance !== "" ? { targetDistance: Number(distance), distanceUnit: unit } : {}) }
            : { format, rounds: Number(rounds), workSeconds: Number(workMin) * 60 + Number(workSec), restSeconds: Number(restMin) * 60 + Number(restSec) });
    } catch { /* Save remains disabled until configuration is valid. */ }
    async function saveTraining() { if (!candidate) return; setSaving(true); setError(""); try { await onSave(candidate); setDirty(false); onDirty(false); } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); } finally { setSaving(false); } }
    async function change(action: "start" | "pause" | "resume" | "reset" | "complete") { if (saving) return;
        if (action === "reset") { setSaving(true); try { await onSave(config); } catch (e) { setError(e instanceof Error ? e.message : "Reset failed"); return; } finally { setSaving(false); } }
        if (action === "start" || action === "resume") onStart(); const t = Date.now(); const next = cardioTimerAction(current.current, config, action, t); current.current = next; setState(next); setNow(t); }
    async function saveCompletion() { const result = cardioCompletion(state, config); if (!result) return; setSaving(true); setError(""); try { await onSave(config, result); } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); } finally { setSaving(false); } }
    function input(label: string, value: string, setter: (v: string) => void) { return <View><Text>{label}</Text><TextInput accessibilityLabel={label} keyboardType="numeric" value={value} editable={!saving} onChangeText={v => { setter(v); setDirty(true); onDirty(true); }} style={styles.input} /></View>; }
    const view = cardioTimerView(state, config, now);
    return <View style={styles.container}>
        {building ? <><Text>Training format: {format}</Text><View style={styles.controls}>{(["strength", "cardio", "intervals"] as const).map(f => <Button key={f} disabled={saving} onPress={() => { setFormat(f); setDirty(true); onDirty(true); }}>{f}</Button>)}</View>
            {format !== "strength" && <>{format === "cardio" && <>{input("Target distance (optional)", distance, setDistance)}<Text>Distance unit: {unit}</Text><View style={styles.controls}>{(["km", "mi", "m"] as const).map(u => <Button key={u} disabled={saving} onPress={() => { setUnit(u); setDirty(true); onDirty(true); }}>{u}</Button>)}</View></>}{format === "intervals" && input("Rounds (1–100)", rounds, setRounds)}{input(format === "intervals" ? "Work minutes" : "Duration minutes", workMin, setWorkMin)}{input("Work seconds (0–59)", workSec, setWorkSec)}{format === "intervals" && <>{input("Rest minutes", restMin, setRestMin)}{input("Rest seconds (0–59)", restSec, setRestSec)}</>}{candidate ? <Text>{format === "intervals" ? `${rounds} rounds · ${workMin}:${workSec.padStart(2, "0")} work · ${restMin}:${restSec.padStart(2, "0")} rest · ` : ""}Total: {formatTrainingSeconds(trainingTotalSeconds(candidate))} (minutes:seconds).{format === "intervals" ? " No final rest." : ""}</Text> : <Text>Enter whole minutes and seconds; work must be positive. Up to 6 hours per phase and 24 hours total.</Text>}</>}
            {dirty && <Button disabled={!candidate || saving} onPress={saveTraining}>{saving ? "Saving…" : "Save configuration"}</Button>}
        </> : config.format !== "strength" && <><Text accessibilityLiveRegion="polite">{view.phase} · Round {view.round} of {config.format === "intervals" ? config.rounds : 1}</Text><Text style={styles.countdown}>{formatTrainingSeconds(view.phaseRemaining)}</Text><Text>Session remaining: {formatTrainingSeconds(view.remaining)} · {view.completedRounds} rounds completed</Text><View style={styles.controls}>
            {state.status === "ready" && <Button disabled={saving} onPress={() => change("start")}>Start cardio</Button>}{state.status === "running" && <Button disabled={saving} onPress={() => change("pause")}>Pause</Button>}{state.status === "paused" && <Button disabled={saving} onPress={() => change("resume")}>Resume</Button>}<Button disabled={saving} onPress={() => change("reset")}>Reset session</Button><Button disabled={saving || state.status === "completed"} onPress={() => change("complete")}>Complete manually</Button>
            {state.status === "completed" && <Button disabled={saving} onPress={saveCompletion}>Save completion</Button>}</View></>}
        {error !== "" && <Text accessibilityRole="alert">{error}</Text>}
    </View>;
}
const styles = StyleSheet.create({ container: { gap: 10, paddingVertical: 12 }, controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, input: { minHeight: 44, padding: 8, borderWidth: 1, borderRadius: 6 }, countdown: { fontSize: 56, fontWeight: "700", fontVariant: ["tabular-nums"] } });
