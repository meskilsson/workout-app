import { useState, type FormEvent } from "react";
import { MUSCLE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS, EXERCISE_TYPE_OPTIONS } from "@workout-app/shared";
import Input from "../../components/ui/input/Input";
import Button from "../../components/ui/button/Button";
import { adminRequest, type AdminItem, type AdminExerciseRow, type Resource } from "../../services/adminApi";
import { ApiRequestError } from "../../utils/parseJsonResponse";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function set(key: string, value: string) { setValues(current => ({ ...current, [key]: value })); }
  function rowSet(index: number, update: Partial<AdminExerciseRow>) { setRows(current => current.map((row, i) => i === index ? { ...row, ...update } : row)); }
  function field(key: string, label: string, required = false, maxLength?: number) {
    return <Input key={key} label={label} value={values[key]} onChange={event => set(key, event.target.value)} required={required} maxLength={maxLength} minLength={key === "name" ? 2 : undefined} error={errors[key]} />;
  }
  function select(key: string, label: string, options: readonly string[]) {
    return <label className={styles.field} key={key}>{label}<select value={values[key]} aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `admin-${key}-error` : undefined} onChange={event => set(key, event.target.value)}><option value="">Choose…</option>{options.map(option => <option key={option}>{option}</option>)}</select>{errors[key] && <span id={`admin-${key}-error`} role="alert">{errors[key]}</span>}</label>;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setErrors({}); setError(""); setBusy(true);
    try {
      let body: unknown;
      if (resource === "exercises") {
        body = { name: values.name, description: values.description, instructions: values.instructions,
          videoUrl: values.videoUrl, imageUrl: values.imageUrl, primaryMuscles: primary, secondaryMuscles: secondary,
          ...(values.equipment ? { equipment: values.equipment } : {}), ...(values.difficulty ? { difficulty: values.difficulty } : {}), ...(values.exerciseType ? { exerciseType: values.exerciseType } : {}) };
      } else if (resource === "templates") {
        body = { name: values.name, description: values.description, category: values.category || "custom",
          exercises: rows.map(row => ({ exerciseId: row.exerciseId ?? row.exercise, plannedSets: row.plannedSets ?? [] })) };
      } else {
        body = { userId: values.userId, startedAt: values.startedAt, endedAt: values.endedAt,
          exercises: rows.map(row => ({ exerciseId: row.exerciseId || null, exerciseName: row.exerciseName, sets: row.sets ?? [] })) };
      }
      await adminRequest(`/${resource}${item ? `/${item._id}` : ""}`, item ? "PUT" : "POST", body); onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save");
      if (cause instanceof ApiRequestError) {
        const data = cause.data as { errors?: { field?: string; message: string }[] };
        setErrors(Object.fromEntries((data?.errors ?? []).map(issue => [issue.field ?? "", issue.message])));
      }
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className={styles.form}>
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
      {errors.exercises && <p role="alert">{errors.exercises}</p>}
      {rows.map((row, index) => <fieldset key={index}><legend>Exercise {index + 1}</legend>
        <Input label="Exercise ID" value={row.exerciseId ?? row.exercise ?? ""} required={resource === "templates"} pattern="[0-9a-fA-F]{24}" onChange={event => rowSet(index, { exerciseId: event.target.value })} error={errors[`exercises.${index}.exerciseId`]} />
        {resource === "sessions" && <Input label="Exercise name" value={row.exerciseName ?? ""} required onChange={event => rowSet(index, { exerciseName: event.target.value })} error={errors[`exercises.${index}.exerciseName`]} />}
        {(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []).map((set, setIndex) => <div className={styles.set} key={setIndex}>
          {(["reps", "weight", ...(resource === "templates" ? ["restSeconds"] : [])] as const).map(key => <Input key={key} label={`${key} (set ${setIndex + 1})`} type="number" min={key === "reps" && resource === "sessions" ? 1 : 0} step={key === "weight" ? "any" : 1} required={resource === "sessions"} value={set[key as keyof typeof set] ?? ""} error={errors[`exercises.${index}.${resource === "templates" ? "plannedSets" : "sets"}.${setIndex}.${key}`]} onChange={event => {
            const sets = [...(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? [])];
            sets[setIndex] = { ...set, [key]: event.target.value === "" ? null : Number(event.target.value) };
            rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets });
          }} />)}
          {resource === "templates" && <Input label={`Notes (set ${setIndex + 1})`} maxLength={200} value={set.notes ?? ""} onChange={event => { const sets = [...row.plannedSets!]; sets[setIndex] = { ...set, notes: event.target.value }; rowSet(index, { plannedSets: sets }); }} />}
          <Button type="button" variant="ghost" onClick={() => { const sets = (resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []).filter((_, i) => i !== setIndex); rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets }); }}>Remove set {setIndex + 1}</Button>
        </div>)}
        <Button type="button" variant="secondary" onClick={() => { const sets = [...(resource === "templates" ? row.plannedSets ?? [] : row.sets ?? []), { reps: 10, weight: 0 }]; rowSet(index, resource === "templates" ? { plannedSets: sets } : { sets }); }}>Add set</Button>
        <Button type="button" variant="ghost" onClick={() => setRows(current => current.filter((_, i) => i !== index))}>Remove exercise {index + 1}</Button>
      </fieldset>)}
      <Button type="button" variant="secondary" onClick={() => setRows(current => [...current, { exerciseId: "", exerciseName: "", sets: [{ reps: 10, weight: 0 }], plannedSets: [{ reps: 10, weight: 0 }] }])}>Add exercise</Button>
    </fieldset>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </form>;
}
