import ValidatedForm from "../../components/forms/ValidatedForm";
import { useAdminMutation } from "../../query/useAdminMutation";
import TrainingConfigForm from "../../components/training/TrainingConfigForm";
import { trainingTotalSeconds } from "@workout-app/shared";
import { useState, type FormEvent } from "react";
import { MUSCLE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS, EXERCISE_TYPE_OPTIONS } from "@workout-app/shared";
import Input from "../../components/ui/input/Input";
import Button from "../../components/ui/button/Button";
import { adminRequest, type AdminItem, type AdminExerciseRow, type Resource } from "../../services/adminApi";
import { reportFormError, friendlyError } from "../../utils/formValidation";

import styles from "./AdminPage.module.css";

const categories = ["full_body", "push", "pull", "legs", "upper", "lower", "custom"];
type Props = { resource: Exclude<Resource, "users">; item: AdminItem | null; onSaved: () => void; onCancel: () => void };
export default function AdminEditor({ resource, item, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries([
    "name", "description", "instructions", "equipment", "difficulty", "exerciseType", "videoUrl", "imageUrl", "category", "userId", "startedAt", "endedAt",
  ].map(key => [key, String(item?.[key as keyof AdminItem] ?? (key === "category" ? "custom" : ""))])));
  const [primary, setPrimary] = useState(item?.primaryMuscles ?? []);
  const [secondary, setSecondary] = useState(item?.secondaryMuscles ?? []);
  const [rows, setRows] = useState<AdminExerciseRow[]>(item?.exercises ?? []);
  const [dirtyConfigs, setDirtyConfigs] = useState<Record<number, boolean>>({});
  const hasUnsavedConfigs = Object.values(dirtyConfigs).some(Boolean);
  const [error, setError] = useState("");
  const save = useAdminMutation((body: unknown) => adminRequest(`/${resource}${item ? `/${item._id}` : ""}`, item ? "PUT" : "POST", body));
  const busy = save.isPending;
  function set(key: string, value: string) { setValues(current => ({ ...current, [key]: value })); }
  function rowSet(index: number, update: Partial<AdminExerciseRow>) { setRows(current => current.map((row, i) => i === index ? { ...row, ...update } : row)); }
  function field(key: string, label: string, required = false, maxLength?: number) {
    return <Input pattern={key === "userId" ? "[0-9a-fA-F]{24}" : undefined} data-validation-hint={key === "userId" ? "Enter a 24-character user ID." : undefined} data-validation-error={(key === "startedAt" || key === "endedAt") && values[key] && Number.isNaN(Date.parse(values[key])) ? "Enter a valid date and time, including its timezone." : key === "endedAt" && Date.parse(values[key]) < Date.parse(values.startedAt) ? "End time must be after the start time." : undefined} key={key} name={key} label={label} value={values[key]} onChange={event => set(key, event.target.value)} required={required} maxLength={maxLength} minLength={key === "name" ? 2 : undefined} />;
  }
  function select(key: string, label: string, options: readonly string[]) {
    return <label className={styles.field} key={key}>{label}<select name={key} value={values[key]} onChange={event => set(key, event.target.value)}><option value="">Choose…</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (busy) { event.preventDefault(); return; }
    event.preventDefault(); const submittedForm = event.currentTarget; setError("");
    try {
      let body: unknown;
      if (resource === "exercises") {
        body = { name: values.name, description: values.description, instructions: values.instructions,
          videoUrl: values.videoUrl, imageUrl: values.imageUrl, primaryMuscles: primary, secondaryMuscles: secondary,
          ...(values.equipment ? { equipment: values.equipment } : {}), ...(values.difficulty ? { difficulty: values.difficulty } : {}), ...(values.exerciseType ? { exerciseType: values.exerciseType } : {}) };
      } else if (resource === "templates") {
        body = { name: values.name, description: values.description, category: values.category || "custom",
          exercises: rows.map(row => ({ exerciseId: row.exerciseId ?? row.exercise, plannedSets: row.plannedSets ?? [], training: row.training })) };
      } else {
        body = { userId: values.userId, startedAt: values.startedAt, endedAt: values.endedAt,
          exercises: rows.map(row => ({ exerciseId: row.exerciseId || null, exerciseName: row.exerciseName, sets: row.sets ?? [], training: row.training, cardioCompletion: row.cardioCompletion })) };
      }
      await save.mutateAsync(body); onSaved();
    } catch (cause) {
      if (!reportFormError(submittedForm, cause)) setError(friendlyError(cause, "Unable to save. Please try again."));
    }
  }

  return <ValidatedForm onSubmit={submit} className={styles.form}>
    <p>{resource === "sessions" ? "Completed workout records are personal data. Choose the owner explicitly." : item ? `Editing ${resource === "exercises" ? item.isCustom ? "a personal exercise" : "a shared exercise" : item.isPublic ? "a shared template" : "a personal template"}. Ownership and visibility are preserved.` : "New exercises and templates are shared with all users."}</p>
    {resource !== "sessions" && field("name", "Name", true, resource === "exercises" ? 50 : 80)}
    {resource !== "sessions" && field("description", "Description", false, resource === "templates" ? 500 : undefined)}
    {resource === "exercises" && <>
      {field("instructions", "Instructions")}{select("equipment", "Equipment", EQUIPMENT_OPTIONS)}{select("difficulty", "Difficulty", DIFFICULTY_OPTIONS)}{select("exerciseType", "Exercise type", EXERCISE_TYPE_OPTIONS)}
      {field("videoUrl", "Video URL")}{field("imageUrl", "Image URL")}
      {([ ["Primary muscles", primary, setPrimary], ["Secondary muscles", secondary, setSecondary] ] as const).map(([label, selected, update]) => <fieldset key={label}><legend>{label}</legend><div className={styles.checks}>{MUSCLE_OPTIONS.map(muscle => <label key={muscle}><input type="checkbox" checked={selected.includes(muscle)} onChange={event => update(event.target.checked ? [...selected, muscle] : selected.filter(value => value !== muscle))} />{muscle}</label>)}</div></fieldset>)}
    </>}
    {resource === "templates" && select("category", "Category", categories)}
    {resource === "sessions" && <>{field("userId", "Owner user ID", true)}{field("startedAt", "Start time (ISO date with timezone)", true)}{field("endedAt", "End time (ISO date with timezone)", true)}</>}
    {resource !== "exercises" && <fieldset><legend>Exercises and sets</legend><p>Use exercise IDs from the Exercises tab. Templates may use shared exercises or their owner's personal exercises.</p>
      {rows.map((row, index) => <fieldset key={index}><legend>Exercise {index + 1}</legend>
        <Input name={`exercises.${index}.exerciseId`} data-validation-hint="Enter a 24-character exercise ID." label="Exercise ID" value={row.exerciseId ?? row.exercise ?? ""} required={resource === "templates"} pattern="[0-9a-fA-F]{24}" onChange={event => rowSet(index, { exerciseId: event.target.value })} />
        {resource === "sessions" && <Input name={`exercises.${index}.exerciseName`} label="Exercise name" value={row.exerciseName ?? ""} required onChange={event => rowSet(index, { exerciseName: event.target.value })} />}
        <TrainingConfigForm embedded fieldPrefix={`exercises.${index}.training.`} initial={row.training} onDirty={dirty => setDirtyConfigs(prev => ({ ...prev, [index]: dirty }))} onSave={async training => rowSet(index, { training, ...(training.format !== "strength" ? { sets: [], plannedSets: [] } : {}), cardioCompletion: undefined })} />
        {resource === "sessions" && row.training && row.training.format !== "strength" && <Input name={`exercises.${index}.cardioCompletion.elapsedSeconds`} label="Actual elapsed seconds" type="number" min={0} max={trainingTotalSeconds(row.training)} step="any" required value={row.cardioCompletion?.elapsedSeconds ?? ""} onChange={event => {
          const training = row.training!;
          const elapsedSeconds = Number(event.target.value);
          const completedRounds = training.format === "intervals" ? Math.min(training.rounds, Math.floor((elapsedSeconds + training.restSeconds) / (training.workSeconds + training.restSeconds))) : training.format === "cardio" && elapsedSeconds >= training.durationSeconds ? 1 : 0;
          rowSet(index, { cardioCompletion: { elapsedSeconds, completedRounds, manual: true } });
        }} />}
        {(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []).map((set, setIndex) => <div className={styles.set} key={setIndex}>
          {(["reps", "weight", ...(resource === "templates" ? ["restSeconds"] : [])] as const).map(key => <Input name={`exercises.${index}.${resource === "templates" ? "plannedSets" : "sets"}.${setIndex}.${key}`} key={key} label={`${key} (set ${setIndex + 1})`} type="number" min={key === "reps" && resource === "sessions" ? 1 : 0} step={key === "weight" ? "any" : 1} required={resource === "sessions"} value={set[key as keyof typeof set] ?? ""} onChange={event => {
            const sets = [...(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? [])];
            sets[setIndex] = { ...set, [key]: event.target.value === "" ? null : Number(event.target.value) };
            rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets });
          }} />)}
          {resource === "templates" && <Input label={`Notes (set ${setIndex + 1})`} maxLength={200} value={set.notes ?? ""} onChange={event => { const sets = [...row.plannedSets!]; sets[setIndex] = { ...set, notes: event.target.value }; rowSet(index, { plannedSets: sets }); }} />}
          <Button type="button" variant="ghost" onClick={() => { const sets = (resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []).filter((_, i) => i !== setIndex); rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets }); }}>Remove set {setIndex + 1}</Button>
        </div>)}
        <Button type="button" variant="secondary" disabled={!!row.training && row.training.format !== "strength"} onClick={() => { const sets = [...(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []), { reps: 10, weight: 0 }]; rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets }); }}>Add set</Button>
        <Button type="button" variant="ghost" onClick={() => { setRows(current => current.filter((_, i) => i !== index)); setDirtyConfigs(prev => Object.fromEntries(Object.entries(prev).filter(([i]) => Number(i) !== index).map(([i, dirty]) => [Number(i) > index ? Number(i) - 1 : Number(i), dirty]))); }}>Remove exercise {index + 1}</Button>
      </fieldset>)}
      <Button type="button" variant="secondary" onClick={() => setRows(current => [...current, { exerciseId: "", exerciseName: "", sets: [{ reps: 10, weight: 0 }], plannedSets: [{ reps: 10, weight: 0 }] }])}>Add exercise</Button>
    </fieldset>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><Button type="submit" disabled={busy || hasUnsavedConfigs}>{busy ? "Saving…" : "Save"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </ValidatedForm>;
}
