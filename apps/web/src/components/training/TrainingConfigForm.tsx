import { useState, type FormEvent } from "react";
import { validateTraining, trainingTotalSeconds, formatTrainingSeconds, type TrainingConfig } from "@workout-app/shared";
import Button from "../ui/button/Button";
import styles from "./Training.module.css";
export default function TrainingConfigForm({ initial, onSave, onDirty, embedded = false }: { embedded?: boolean; initial?: TrainingConfig; onSave: (config: TrainingConfig) => Promise<void>; onDirty: (dirty: boolean) => void }) {
    const config = initial ?? { format: "strength" };
    const [format, setFormat] = useState(config.format);
    const [rounds, setRounds] = useState(String(config.format === "intervals" ? config.rounds : 8));
    const [work, setWork] = useState(config.format === "intervals" ? config.workSeconds : 30);
    const [rest, setRest] = useState(config.format === "intervals" ? config.restSeconds : 90);
    const [duration, setDuration] = useState(config.format === "cardio" ? config.durationSeconds : 600);
    const [distance, setDistance] = useState(config.format === "cardio" && config.targetDistance ? String(config.targetDistance) : "");
    const [unit, setUnit] = useState<"km" | "mi" | "m">(config.format === "cardio" ? config.distanceUnit ?? "km" : "km");
    const [dirty, setDirty] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState("");
    function change() { setDirty(true); onDirty(true); }
    let candidate: TrainingConfig | undefined, validation = "";
    try { candidate = validateTraining(format === "strength" ? { format } : format === "intervals" ? { format, rounds: Number(rounds), workSeconds: work, restSeconds: rest }
        : { format, durationSeconds: duration, ...(distance !== "" ? { targetDistance: Number(distance), distanceUnit: unit } : {}) }); }
    catch (e) { validation = e instanceof Error ? e.message : "Invalid configuration"; }
    async function submit(e?: FormEvent) {
        e?.preventDefault(); if (!candidate || saving) return;
        setSaving(true); setError("");
        try { await onSave(candidate); setDirty(false); onDirty(false); }
        catch (e) { setError(e instanceof Error ? e.message : "Could not save configuration"); }
        finally { setSaving(false); }
    }
    function durationInputs(label: string, value: number, update: (n: number) => void) {
        return <fieldset className={styles.duration}><legend>{label}</legend>
            <label>Minutes<input type="number" min="0" max="360" step="1" required value={Number.isFinite(value) ? Math.floor(value / 60) : ""} onChange={e => { change(); update(e.target.value === "" ? NaN : Number(e.target.value) * 60 + (Number.isFinite(value) ? value % 60 : 0)); }} /></label>
            <label>Seconds<input type="number" min="0" max="59" step="1" required value={Number.isFinite(value) ? value % 60 : ""} onChange={e => { change(); update(e.target.value === "" ? NaN : (Number.isFinite(value) ? Math.floor(value / 60) : 0) * 60 + Number(e.target.value)); }} /></label>
        </fieldset>;
    }
    const body = <>
        <fieldset disabled={saving} className={styles.fields}>
        <label className={styles.formatField}>Training format<select value={format} onChange={e => { change(); setFormat(e.target.value as TrainingConfig["format"]); }}><option value="strength">Strength</option><option value="cardio">Continuous cardio</option><option value="intervals">Intervals</option></select></label>
        {format === "intervals" && <><label className={styles.roundsField}>Rounds<input type="number" min="1" max="100" step="1" required value={rounds} onChange={e => { change(); setRounds(e.target.value); }} /></label>{durationInputs("Work per round", work, setWork)}{durationInputs("Rest between rounds", rest, setRest)}</>}
        {format === "cardio" && <>{durationInputs("Planned duration", duration, setDuration)}<label>Target distance (optional)<input type="number" min="0.001" max="1000000" step="any" value={distance} onChange={e => { change(); setDistance(e.target.value); }} /></label><label>Distance unit<select value={unit} onChange={e => { change(); setUnit(e.target.value as typeof unit); }}><option value="km">km</option><option value="mi">mi</option><option value="m">m</option></select></label></>}
        </fieldset>
        {candidate && candidate.format !== "strength" && <div className={styles.overview}>
            <strong>Total: {formatTrainingSeconds(trainingTotalSeconds(candidate))} (minutes:seconds)</strong>
            {candidate.format === "intervals" && <><span>{candidate.rounds} rounds · {formatTrainingSeconds(candidate.workSeconds)} work · {formatTrainingSeconds(candidate.restSeconds)} rest</span><small>No rest after the final round.</small></>}
        </div>}
        {format !== "strength" && <small>Up to 100 rounds, 6 hours per phase, and 24 hours total.</small>}
        {(validation || error) && <p className={styles.error} role="alert">{validation || error}</p>}
        {dirty && <Button type={embedded ? "button" : "submit"} onClick={embedded ? () => { void submit(); } : undefined} disabled={saving || !candidate}>{saving ? "Saving…" : "Save configuration"}</Button>}
    </>;
    return embedded ? <div className={styles.config}>{body}</div> : <form className={styles.config} onSubmit={submit}>{body}</form>;
}
