import { friendlyError, reportFormError } from "../../utils/formValidation";
import ValidatedForm from "../forms/ValidatedForm";
import { useState, type FormEvent } from "react";
import { validateTraining, trainingTotalSeconds, formatTrainingSeconds, type TrainingConfig } from "@workout-app/shared";
import Button from "../ui/button/Button";
import styles from "./Training.module.css";
export default function TrainingConfigForm({ initial, onSave, onDirty, embedded = false, fieldPrefix = "training.", cardioOnly = false, initialMode }: { cardioOnly?: boolean; initialMode?: "cardio" | "intervals"; embedded?: boolean; fieldPrefix?: string; initial?: TrainingConfig; onSave: (config: TrainingConfig) => Promise<void>; onDirty: (dirty: boolean) => void }) {
    const config = initial ?? { format: "strength" };
    const [format, setFormat] = useState(initialMode ?? config.format);
    const [rounds, setRounds] = useState(String(config.format === "intervals" ? config.rounds : 8));
    const [work, setWork] = useState(config.format === "intervals" ? config.workSeconds : 30);
    const [rest, setRest] = useState(config.format === "intervals" ? config.restSeconds : 90);
    const [duration, setDuration] = useState(config.format === "cardio" ? config.durationSeconds : 600);
    const [distance, setDistance] = useState(config.format === "cardio" && config.targetDistance ? String(config.targetDistance) : "");
    const [unit, setUnit] = useState<"km" | "mi" | "m">(config.format === "cardio" ? config.distanceUnit ?? "km" : "km");
    const [dirty, setDirty] = useState(!!initialMode && initialMode !== config.format), [saving, setSaving] = useState(false), [error, setError] = useState("");
    function change() { setDirty(true); onDirty(true); }
    let candidate: TrainingConfig | undefined;
    try { candidate = validateTraining(format === "strength" ? { format } : format === "intervals" ? { format, rounds: Number(rounds), workSeconds: work, restSeconds: rest }
        : { format, durationSeconds: duration, ...(distance !== "" ? { targetDistance: Number(distance), distanceUnit: unit } : {}) }); }
    catch { /* Inline constraints below explain invalid configuration values on submission. */ }
    async function submit(e?: FormEvent<HTMLFormElement>) {
        e?.preventDefault(); const submittedForm = e?.currentTarget; if (!candidate || saving) return;
        setSaving(true); setError("");
        try { await onSave(candidate); setDirty(false); onDirty(false); }
        catch (error) { if (!submittedForm || !reportFormError(submittedForm, error)) setError(friendlyError(error, "Could not save configuration. Please try again.")); }
        finally { setSaving(false); }
    }
    function durationInputs(label: string, value: number, update: (n: number) => void, minimum: number) {
        return <fieldset className={styles.duration}><legend>{label}</legend>
            <label>Minutes<input name={`${fieldPrefix}${label === "Planned duration" ? "durationSeconds" : label === "Work per round" ? "workSeconds" : "restSeconds"}`} data-validation-error={Number.isFinite(value) && (value < minimum || value > 21600) ? `Choose ${minimum === 1 ? "at least 1 second and " : ""}no more than 6 hours.` : undefined} type="number" min="0" max="360" step="1" required value={Number.isFinite(value) ? Math.floor(value / 60) : ""} onChange={e => { change(); update(e.target.value === "" ? NaN : Number(e.target.value) * 60 + (Number.isFinite(value) ? value % 60 : 0)); }} /></label>
            <label>Seconds<input type="number" min="0" max="59" step="1" required value={Number.isFinite(value) ? value % 60 : ""} onChange={e => { change(); update(e.target.value === "" ? NaN : (Number.isFinite(value) ? Math.floor(value / 60) : 0) * 60 + Number(e.target.value)); }} /></label>
        </fieldset>;
    }
    const body = <>
        <fieldset disabled={saving} className={styles.fields}>
        {cardioOnly ? !initialMode && <div className={styles.controls}>
            <Button type="button" variant="secondary" aria-pressed={format === "cardio"} onClick={() => { change(); setFormat("cardio"); }}>Continuous</Button>
            <Button type="button" variant="secondary" aria-pressed={format === "intervals"} onClick={() => { change(); setFormat("intervals"); }}>Intervals</Button>
        </div> : <label className={styles.formatField}>Training format<select name={`${fieldPrefix}format`} value={format} onChange={e => { change(); setFormat(e.target.value as TrainingConfig["format"]); }}><option value="strength">Strength</option><option value="cardio">Continuous cardio</option><option value="intervals">Intervals</option></select></label>}
        {format === "intervals" && <><label className={styles.roundsField}>Rounds<input name={`${fieldPrefix}rounds`} data-validation-error={Number(rounds) * work + (Number(rounds) - 1) * rest > 86400 ? "Reduce the rounds or phase durations to stay within 24 hours total." : undefined} type="number" min="1" max="100" step="1" required value={rounds} onChange={e => { change(); setRounds(e.target.value); }} /></label>{durationInputs("Work per round", work, setWork, 1)}{durationInputs("Rest between rounds", rest, setRest, 0)}</>}
        {format === "cardio" && <>{durationInputs("Planned duration", duration, setDuration, 1)}<label>Target distance (optional)<input name={`${fieldPrefix}targetDistance`} type="number" min="0.001" max="1000000" step="any" value={distance} onChange={e => { change(); setDistance(e.target.value); }} /></label><label>Distance unit<select name={`${fieldPrefix}distanceUnit`} value={unit} onChange={e => { change(); setUnit(e.target.value as typeof unit); }}><option value="km">km</option><option value="mi">mi</option><option value="m">m</option></select></label></>}
        </fieldset>
        {candidate && candidate.format !== "strength" && <div className={styles.overview}>
            <strong>Total: {formatTrainingSeconds(trainingTotalSeconds(candidate))} (minutes:seconds)</strong>
            {candidate.format === "intervals" && <><span>{candidate.rounds} rounds · {formatTrainingSeconds(candidate.workSeconds)} work · {formatTrainingSeconds(candidate.restSeconds)} rest</span><small>No rest after the final round.</small></>}
        </div>}
        {format !== "strength" && <small>Up to 100 rounds, 6 hours per phase, and 24 hours total.</small>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {dirty && <Button data-validate type={embedded ? "button" : "submit"} onClick={embedded ? () => { void submit(); } : undefined} disabled={saving}>{saving ? "Saving…" : cardioOnly ? "Save" : "Save configuration"}</Button>}
    </>;
    return <ValidatedForm embedded={embedded} className={styles.config} onSubmit={submit}>{body}</ValidatedForm>;
}
