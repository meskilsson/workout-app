import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Txt,
  Action,
  Row,
  Field,
  Form,
  Busy,
  confirm,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { apiFetch, ApiError } from "../services/apiClient";
import { t, label } from "../i18n";
import { ExerciseEditor } from "./ExercisesScreen";
import { TemplateEditor } from "./TemplatesScreen";
import {
  trainingTotalSeconds,
  validateCardioCompletion,
} from "@workout-app/shared";
import { firstInvalidSet } from "../state/setValidation";
import TrainingActivity from "../components/TrainingActivity";
import type {
  Exercise,
  WorkoutTemplate,
  WorkoutSession,
} from "@workout-app/shared";

type Resource = "users" | "exercises" | "templates" | "sessions";
type Item = {
  _id: string;
  name?: string;
  email?: string;
  username?: string;
  role?: "user" | "admin";
  deletedAt?: string | null;
  totals?: Record<string, number>;
  exercises?: unknown[];
  userId?: string;
  startedAt?: string;
  endedAt?: string;
};
export default function AdminScreen() {
  const { token, user } = useAuth();
  const [resource, setResource] = useState<Resource>("users"),
    [search, setSearch] = useState(""),
    [scope, setScope] = useState("all"),
    [page, setPage] = useState(1),
    [data, setData] = useState<{
      items: Item[];
      total: number;
      limit: number;
    } | null>(null),
    [dashboard, setDashboard] = useState<Record<string, unknown>>({}),
    [item, setItem] = useState<Item | null>(null),
    [edit, setEdit] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const request = <T,>(path: string, method = "GET", body?: unknown) =>
    apiFetch<T>(`/api/admin${path}`, {
      token,
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  useEffect(() => {
    if (user?.role !== "admin") return;
    let alive = true;
    void request<Record<string, unknown>>("/dashboard")
      .then((value) => {
        if (alive) setDashboard(value);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [revision]);
  useEffect(() => {
    if (user?.role !== "admin") return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      void apiFetch<{ items: Item[]; total: number; limit: number }>(
        `/api/admin/${resource}?${new URLSearchParams({ search, scope, page: String(page), limit: "20" })}`,
        { token, signal: controller.signal },
      )
        .then(setData)
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [resource, search, scope, page, revision]);
  if (user?.role !== "admin")
    return (
      <Page>
        <Txt>Forbidden</Txt>
      </Page>
    );
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      setRevision((previous) => previous + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function open(row: Item) {
    void run(async () => {
      setItem(await request<Item>(`/${resource}/${row._id}`));
    });
  }
  const save = async (body: Record<string, unknown>) => {
    await request(
      `/${resource}${item ? `/${item._id}` : ""}`,
      item ? "PUT" : "POST",
      body,
    );
    setEdit(false);
    setItem(null);
    setRevision(revision + 1);
  };
  if (edit && resource !== "users")
    return (
      <Page>
        <Txt title>{`Edit ${resource}`}</Txt>
        {resource === "exercises" ? (
          <ExerciseEditor
            initial={item as Exercise | null}
            onSave={save}
            onCancel={() => setEdit(false)}
          />
        ) : resource === "templates" ? (
          <TemplateEditor
            admin
            initial={normalizeTemplate(item)}
            onSave={save}
            onCancel={() => setEdit(false)}
          />
        ) : (
          <SessionEditor
            initial={item as unknown as WorkoutSession | null}
            onSave={save}
            onCancel={() => setEdit(false)}
          />
        )}
      </Page>
    );
  return (
    <Page>
      <Txt title>Administration</Txt>
      {error && <Txt error>{error}</Txt>}
      <Card>
        {Object.entries(dashboard).map(([key, value]) =>
          typeof value === "number" ? (
            <Txt key={key}>{`${key}: ${value}`}</Txt>
          ) : value && typeof value === "object" ? (
            Object.entries(value).map(([name, count]) => (
              <Txt key={`${key}.${name}`}>{`${name}: ${count}`}</Txt>
            ))
          ) : null,
        )}
      </Card>
      <Row>
        {(["users", "exercises", "templates", "sessions"] as const).map(
          (value) => (
            <Action
              key={value}
              selected={resource === value}
              onPress={() => {
                setResource(value);
                setItem(null);
                setPage(1);
              }}
            >
              {value}
            </Action>
          ),
        )}
      </Row>
      {item ? (
        <>
          <Action onPress={() => setItem(null)}>Back</Action>
          <Card>
            <Txt title>{item.name || item.username || item._id}</Txt>
            <Txt>{item._id}</Txt>
            {item.email && <Txt>{item.email}</Txt>}
            {item.totals &&
              Object.entries(item.totals).map(([key, value]) => (
                <Txt key={key}>{`${key}: ${value}`}</Txt>
              ))}
            {item.exercises?.map((row: any, i) => (
              <Txt
                key={i}
              >{`${row.exerciseName || row.exercise?.name || row.exerciseId || ""} · ${row.training?.format || "strength"} · ${(row.sets ?? row.plannedSets ?? []).map((s: any) => `${s.weight ?? "—"} kg × ${s.reps ?? "—"}`).join(", ")}`}</Txt>
            ))}
          </Card>
          {resource === "users" ? (
            <>
              <Txt>{item.role ?? ""}</Txt>
              <Action
                disabled={busy || item._id === user._id}
                onPress={() =>
                  confirm(
                    "Change role",
                    () =>
                      void run(async () => {
                        const updated = await request<Item>(
                          `/users/${item._id}`,
                          "PATCH",
                          { role: item.role === "admin" ? "user" : "admin" },
                        );
                        setItem(updated);
                      }),
                  )
                }
              >
                Change role
              </Action>
              <Action
                disabled={busy || item._id === user._id}
                onPress={() =>
                  confirm(
                    item.deletedAt ? "Restore account" : "Deactivate account",
                    () =>
                      void run(async () => {
                        const updated = await request<Item>(
                          `/users/${item._id}`,
                          "PATCH",
                          { active: !!item.deletedAt },
                        );
                        setItem(updated);
                      }),
                  )
                }
              >
                {item.deletedAt ? "Restore account" : "Deactivate account"}
              </Action>
            </>
          ) : (
            <>
              <Action onPress={() => setEdit(true)}>Edit</Action>
              <Action
                disabled={busy}
                onPress={() =>
                  confirm(
                    "Delete",
                    () =>
                      void run(async () => {
                        await request(`/${resource}/${item._id}`, "DELETE");
                        setItem(null);
                      }),
                  )
                }
              >
                Delete
              </Action>
            </>
          )}
        </>
      ) : (
        <>
          <Field
            title="Search"
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <Row>
            {["all", "shared", "personal"].map((v) => (
              <Action
                key={v}
                selected={scope === v}
                onPress={() => {
                  setScope(v);
                  setPage(1);
                }}
              >
                {v}
              </Action>
            ))}
          </Row>
          {resource !== "users" && (
            <Action
              onPress={() => {
                setItem(null);
                setEdit(true);
              }}
            >
              Create
            </Action>
          )}
          {loading ? (
            <Busy />
          ) : data?.items.length === 0 ? (
            <Txt>No results</Txt>
          ) : (
            data?.items.map((row) => (
              <Card key={row._id}>
                <Action disabled={busy} onPress={() => open(row)}>
                  {row.name || row.username || row._id}
                </Action>
                <Txt>{row._id}</Txt>
              </Card>
            ))
          )}
          <Row>
            <Action
              disabled={page === 1 || loading}
              onPress={() => setPage(page - 1)}
            >
              Previous
            </Action>
            <Txt>{`${page}`}</Txt>
            <Action
              disabled={!data || page * data.limit >= data.total || loading}
              onPress={() => setPage(page + 1)}
            >
              Next
            </Action>
            <Action onPress={() => setRevision(revision + 1)}>Refresh</Action>
          </Row>
        </>
      )}
    </Page>
  );
}
function normalizeTemplate(item: Item | null): WorkoutTemplate | null {
  if (!item) return null;
  const source = item as any;
  return {
    ...source,
    exercises: (source.exercises ?? []).map((e: any) => ({
      ...e,
      exercise:
        typeof e.exercise === "object"
          ? e.exercise
          : {
              _id: e.exerciseId ?? e.exercise,
              name: e.exerciseName ?? e.exerciseId ?? e.exercise,
            },
    })),
  };
}
function SessionEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: WorkoutSession | null;
  onSave: (v: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  type EditableExercise = Omit<WorkoutSession["exercises"][number], "sets"> & {
    sets: {
      weight: string | number;
      reps: string | number;
      isWarmup?: boolean;
    }[];
  };
  const [rows, setRows] = useState<EditableExercise[]>(
    initial?.exercises ?? [],
  );
  const [elapsedText, setElapsedText] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusPath, setFocusPath] = useState("");
  const fieldState = (path: string) => ({
    error: fieldErrors[path],
    focus: focusPath === path,
    focusRequest: fieldErrors,
  });
  return (
    <>
      <Form
        fields={[
          {
            name: "userId",
            title: "Owner user ID",
            value: initial?.userId,
            required: true,
            pattern: /^[a-f\d]{24}$/i,
          },
          {
            name: "startedAt",
            title: "Start time (ISO with timezone)",
            value: initial?.startedAt ?? "",
            required: true,
          },
          {
            name: "endedAt",
            title: "End time (ISO with timezone)",
            value: initial?.endedAt,
            required: true,
          },
        ]}
        onCancel={onCancel}
        onFieldErrors={(errors, focusAllowed) => {
          const paths = Object.keys(errors).filter((path) =>
            path.startsWith("exercises."),
          );
          setFieldErrors(errors);
          setFocusPath(focusAllowed ? (paths[0] ?? "") : "");
          return paths.length > 0;
        }}
        validate={(values) => {
          const errors: Record<string, string> = {};
          if (!Number.isFinite(Date.parse(values.startedAt)))
            errors.startedAt = t(
              "AdminEditor.enterAValidDateAndTimeIncludingItsTimezone",
            );
          if (!Number.isFinite(Date.parse(values.endedAt)))
            errors.endedAt = t(
              "AdminEditor.enterAValidDateAndTimeIncludingItsTimezone",
            );
          else if (Date.parse(values.endedAt) < Date.parse(values.startedAt))
            errors.endedAt = t("AdminEditor.endTimeMustBeAfterTheStartTime");
          return errors;
        }}
        submit={async (values) => {
          if (!rows.length)
            throw new Error("At least one exercise is required");
          if (
            !Number.isFinite(Date.parse(values.startedAt)) ||
            !Number.isFinite(Date.parse(values.endedAt)) ||
            Date.parse(values.endedAt) < Date.parse(values.startedAt)
          )
            throw new Error("Enter valid start and end times");
          const invalid = firstInvalidSet({
            exercises: rows.map((row) => ({
              ...row,
              exerciseId: row.exerciseId ?? "",
            })),
          });
          const errors: Record<string, string> = {};
          if (invalid) {
            const parts = invalid.id.split(":");
            const row = rows.findIndex(
              (e) => (e.exerciseId ?? "") === parts[0],
            );
            errors[`exercises.${row}.sets.${parts[1]}.${invalid.field}`] =
              invalid.message;
          }
          rows.forEach((row, i) => {
            if (!row.exerciseName.trim())
              errors[`exercises.${i}.exerciseName`] = t(
                "formValidation.valueIsRequired",
                { value0: t("common.name") },
              );
            if (row.exerciseId && !/^[a-f\d]{24}$/i.test(row.exerciseId))
              errors[`exercises.${i}.exerciseId`] = t(
                "AdminEditor.enterA24CharacterExerciseID",
              );
            if (row.training && row.training.format !== "strength") {
              const entered = elapsedText[i];
              if (
                entered !== undefined &&
                (!entered.trim() ||
                  !Number.isFinite(Number(entered.replace(",", "."))) ||
                  Number(entered.replace(",", ".")) < 0 ||
                  Number(entered.replace(",", ".")) >
                    trainingTotalSeconds(row.training))
              )
                errors[`exercises.${i}.cardioCompletion.elapsedSeconds`] = t(
                  "formValidation.enterAValidNumber",
                );
              else {
                try {
                  validateCardioCompletion(row.cardioCompletion, row.training);
                } catch {
                  errors[`exercises.${i}.cardioCompletion.elapsedSeconds`] = t(
                    "formValidation.enterAValidNumber",
                  );
                }
              }
            }
            row.sets.forEach((set, j) => {
              for (const field of ["weight", "reps"] as const)
                if (String(set[field]).trim() === "")
                  errors[`exercises.${i}.sets.${j}.${field}`] = t(
                    "formValidation.valueIsRequired",
                    { value0: label(field) },
                  );
            });
          });
          if (Object.keys(errors).length)
            throw new ApiError("Validation error", 400, errors);
          await onSave({
            ...values,
            exercises: rows.map((row) => ({
              exerciseId: row.exerciseId || null,
              exerciseName: row.exerciseName,
              training: row.training,
              cardioCompletion: row.cardioCompletion,
              ...(row.supersetId ? { supersetId: row.supersetId } : {}),
              sets: row.sets.map((set) => ({
                weight: Number(set.weight),
                reps: Number(set.reps),
                ...(set.isWarmup !== undefined
                  ? { isWarmup: set.isWarmup }
                  : {}),
              })),
            })),
          });
        }}
      />
      {rows.map((row, index) => (
        <Card key={index}>
          {Object.entries(fieldErrors)
            .filter(
              ([path]) =>
                path === `exercises.${index}` ||
                path.startsWith(`exercises.${index}.training`),
            )
            .map(([path, message]) => (
              <Txt error key={path}>
                {message}
              </Txt>
            ))}
          <Field
            title="Exercise ID"
            {...fieldState(`exercises.${index}.exerciseId`)}
            value={row.exerciseId ?? ""}
            onChangeText={(exerciseId) =>
              setRows((previous) =>
                previous.map((e, i) =>
                  i === index ? { ...e, exerciseId } : e,
                ),
              )
            }
          />
          <Field
            title="Exercise name"
            {...fieldState(`exercises.${index}.exerciseName`)}
            value={row.exerciseName}
            onChangeText={(exerciseName) =>
              setRows((previous) =>
                previous.map((e, i) =>
                  i === index ? { ...e, exerciseName } : e,
                ),
              )
            }
          />
          <TrainingActivity
            building
            initial={row.training}
            exerciseId={row.exerciseId ?? String(index)}
            activeId={null}
            onStart={() => {}}
            onDirty={() => {}}
            onSave={async (training) =>
              setRows((previous) =>
                previous.map((e, i) =>
                  i === index
                    ? {
                        ...e,
                        training,
                        cardioCompletion: undefined,
                        sets: training.format === "strength" ? e.sets : [],
                      }
                    : e,
                ),
              )
            }
          />
          {row.training && row.training.format !== "strength" && (
            <Field
              title="Actual elapsed seconds"
              {...fieldState(
                `exercises.${index}.cardioCompletion.elapsedSeconds`,
              )}
              keyboardType="decimal-pad"
              value={
                elapsedText[index] ??
                String(row.cardioCompletion?.elapsedSeconds ?? "")
              }
              onChangeText={(text) => {
                setElapsedText((previous) => ({ ...previous, [index]: text }));
                const elapsedSeconds = Number(text.replace(",", "."));
                const training = row.training!;
                if (
                  !Number.isFinite(elapsedSeconds) ||
                  elapsedSeconds < 0 ||
                  elapsedSeconds > trainingTotalSeconds(training)
                )
                  return;
                const completedRounds =
                  training.format === "intervals"
                    ? Math.min(
                        training.rounds,
                        Math.floor(
                          (elapsedSeconds + training.restSeconds) /
                            (training.workSeconds + training.restSeconds),
                        ),
                      )
                    : training.format === "cardio" &&
                        elapsedSeconds >= training.durationSeconds
                      ? 1
                      : 0;
                setRows((previous) =>
                  previous.map((e, i) =>
                    i === index
                      ? {
                          ...e,
                          cardioCompletion: {
                            elapsedSeconds,
                            completedRounds,
                            manual: true,
                          },
                        }
                      : e,
                  ),
                );
              }}
            />
          )}
          {row.sets.map((set, setIndex) => (
            <Row key={setIndex}>
              {(["weight", "reps"] as const).map((field) => (
                <Field
                  key={field}
                  title={field}
                  {...fieldState(
                    `exercises.${index}.sets.${setIndex}.${field}`,
                  )}
                  keyboardType="decimal-pad"
                  value={String(set[field])}
                  onChangeText={(text) => {
                    const value = text.replace(",", ".");
                    setRows((previous) =>
                      previous.map((e, i) =>
                        i === index
                          ? {
                              ...e,
                              sets: e.sets.map((s, j) =>
                                j === setIndex ? { ...s, [field]: value } : s,
                              ),
                            }
                          : e,
                      ),
                    );
                  }}
                />
              ))}
              <Action
                onPress={() =>
                  setRows((previous) =>
                    previous.map((e, i) =>
                      i === index
                        ? {
                            ...e,
                            sets: e.sets.filter((_, j) => j !== setIndex),
                          }
                        : e,
                    ),
                  )
                }
              >
                Remove set
              </Action>
            </Row>
          ))}
          <Action
            onPress={() =>
              setRows((previous) =>
                previous.map((e, i) =>
                  i === index
                    ? { ...e, sets: [...e.sets, { weight: 0, reps: 10 }] }
                    : e,
                ),
              )
            }
          >
            Add set
          </Action>
          <Action
            onPress={() =>
              setRows((previous) => previous.filter((_, i) => i !== index))
            }
          >
            Remove exercise
          </Action>
        </Card>
      ))}
      <Action
        onPress={() =>
          setRows((previous) => [
            ...previous,
            {
              exerciseId: null,
              exerciseName: "",
              sets: [{ weight: 0, reps: 10 }],
            },
          ])
        }
      >
        Add exercise
      </Action>
    </>
  );
}
