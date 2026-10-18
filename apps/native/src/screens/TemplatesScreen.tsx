import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import { useEffect, useCallback, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "../services/apiClient";
import { t } from "../i18n";
import {
  type Exercise,
  type WorkoutTemplate,
  type TrainingConfig,
  type WorkoutTemplateSet,
} from "@workout-app/shared";
import {
  Page,
  Card,
  Txt,
  Action,
  Row,
  Form,
  Field,
  Busy,
  confirm,
} from "../components/ui";
import ExerciseBrowser from "../components/ExerciseBrowser";
import TrainingActivity from "../components/TrainingActivity";
import { useWorkout } from "../context/WorkoutContext";
import { useAuth } from "../context/AuthContext";
import type { WorkoutDraft } from "../services/workoutDraftApi";
import {
  formatTrainingSeconds,
  trainingTotalSeconds,
} from "@workout-app/shared";

type RowData = {
  exerciseId: string;
  name: string;
  training?: TrainingConfig;
  plannedSets: {
    weight?: number | string | null;
    reps?: number | string | null;
    restSeconds?: number | string | null;
    notes?: string;
  }[];
};
const categories = [
  "full_body",
  "push",
  "pull",
  "legs",
  "upper",
  "lower",
  "custom",
];
export default function TemplatesScreen({ navigation }: { navigation: any }) {
  const w = useWorkout();
  const { user } = useAuth();
  const [mine, setMine] = useState(false),
    [templates, setTemplates] = useState<WorkoutTemplate[]>([]),
    [selected, setSelected] = useState<WorkoutTemplate | null>(null),
    [editing, setEditing] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [category, setCategory] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void w
      .request<WorkoutTemplate[]>(
        `/api/workout-templates/${mine ? "my" : "public"}`,
      )
      .then((data) => {
        if (alive) setTemplates(data);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [mine, revision]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (editing) return false;
          if (selected) {
            setSelected(null);
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [editing, selected]),
  );
  async function start() {
    const draft = await w.request<WorkoutDraft>(
      `/api/workout-templates/${selected!._id}/start`,
      "POST",
    );
    w.adopt(draft);
    await w.mutate("/start");
    navigation.navigate("MainTabs", { screen: "Train" });
  }
  if (editing)
    return (
      <Page>
        <Txt title>{selected ? "Edit template" : "Create template"}</Txt>
        <TemplateEditor
          initial={selected}
          onCancel={() => setEditing(false)}
          onSave={async (values) => {
            const saved = await w.request<WorkoutTemplate>(
              `/api/workout-templates${selected ? `/${selected._id}` : ""}`,
              selected ? "PATCH" : "POST",
              values,
            );
            setSelected(saved);
            setEditing(false);
            setRevision(revision + 1);
          }}
        />
      </Page>
    );
  return (
    <Page>
      <Txt title>Workout templates</Txt>
      {selected ? (
        <>
          <Action onPress={() => setSelected(null)}>Back</Action>
          <Card>
            <Txt title literal>
              {selected.name}
            </Txt>
            <Txt>{selected.description ?? ""}</Txt>
            <Txt>{selected.category}</Txt>
            {selected.exercises.map((e, index) => (
              <Card key={index}>
                <Txt>{e.exerciseName || e.exercise?.name || ""}</Txt>
                {e.training && e.training.format !== "strength" ? (
                  <Txt>{`${e.training.format} · ${formatTrainingSeconds(trainingTotalSeconds(e.training))}`}</Txt>
                ) : (
                  e.plannedSets.map((s, i) => (
                    <Txt
                      key={i}
                    >{`${i + 1}: ${s.weight ?? "—"} kg × ${s.reps ?? "—"} · ${s.restSeconds ?? "—"} s ${s.notes ?? ""}`}</Txt>
                  ))
                )}
              </Card>
            ))}
          </Card>
          <Action
            disabled={w.busy}
            onPress={() =>
              !user
                ? navigation.navigate("Login")
                : w.draft
                  ? confirm("Replace current workout?", () => void w.run(start))
                  : void w.run(start)
            }
          >
            Start workout
          </Action>
          {selected.createdBy === user?._id && (
            <>
              <Action onPress={() => setEditing(true)}>Edit template</Action>
              <Action
                disabled={w.busy}
                onPress={() =>
                  confirm(
                    "Delete template",
                    () =>
                      void w.run(async () => {
                        await w.request(
                          `/api/workout-templates/${selected._id}`,
                          "DELETE",
                        );
                        setSelected(null);
                        setRevision(revision + 1);
                      }),
                  )
                }
              >
                Delete template
              </Action>
            </>
          )}
          {w.error && <Txt error>{w.error}</Txt>}
        </>
      ) : (
        <>
          <Row>
            <Action selected={!mine} onPress={() => setMine(false)}>
              Shared templates
            </Action>
            {user && (
              <Action selected={mine} onPress={() => setMine(true)}>
                My templates
              </Action>
            )}
          </Row>
          {user && (
            <Action onPress={() => setEditing(true)}>Create template</Action>
          )}
          <Row>
            {["", ...categories].map((c) => (
              <Action
                key={c}
                selected={c === category}
                onPress={() => setCategory(c)}
              >
                {c || "All"}
              </Action>
            ))}
          </Row>
          {loading ? (
            <Busy />
          ) : error ? (
            <>
              <Txt error>{error}</Txt>
              <Action onPress={() => setRevision(revision + 1)}>
                Try again
              </Action>
            </>
          ) : templates.filter(
              (template) => !category || template.category === category,
            ).length === 0 ? (
            <Txt>No templates found</Txt>
          ) : (
            templates
              .filter((template) => !category || template.category === category)
              .map((template) => (
                <Card key={template._id}>
                  <Action literal onPress={() => setSelected(template)}>
                    {template.name}
                  </Action>
                  <Txt>{template.description ?? ""}</Txt>
                  <Txt>{template.category}</Txt>
                </Card>
              ))
          )}
        </>
      )}
    </Page>
  );
}
export function TemplateEditor({
  initial,
  onSave,
  onCancel,
  admin = false,
}: {
  admin?: boolean;
  initial: WorkoutTemplate | null;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<RowData[]>(
      initial?.exercises.map((e) => ({
        exerciseId: e.exercise?._id ?? "",
        name: e.exerciseName || e.exercise?.name || "",
        training: e.training,
        plannedSets: e.plannedSets,
      })) ?? [],
    ),
    [choose, setChoose] = useState(false),
    [category, setCategory] = useState(initial?.category ?? "custom"),
    [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [metadata, setMetadata] = useState<Record<string, string>>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusPath, setFocusPath] = useState("");
  const { user } = useAuth();
  const [restored, setRestored] = useState(false);
  const storageQueue = useRef(Promise.resolve());
  const editorMounted = useRef(true);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (choose) setChoose(false);
          else onCancel();
          return true;
        },
      );
      return () => subscription.remove();
    }, [choose, onCancel]),
  );
  useEffect(() => {
    editorMounted.current = true;
    return () => {
      editorMounted.current = false;
    };
  }, []);
  const storageKey = `template-edit:${user?._id}:${admin ? "admin" : "personal"}:${initial?._id ?? "new"}`;
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!alive || !value) return;
        const saved = JSON.parse(value);
        if (
          saved.baseUpdatedAt !== initial?.updatedAt ||
          !Array.isArray(saved.rows) ||
          !saved.rows.every(
            (row: RowData) =>
              typeof row.exerciseId === "string" &&
              Array.isArray(row.plannedSets),
          )
        )
          return;
        setRows(saved.rows);
        if (categories.includes(saved.category)) setCategory(saved.category);
        if (
          typeof saved.metadata?.name === "string" &&
          typeof saved.metadata.description === "string"
        )
          setMetadata(saved.metadata);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setRestored(true);
      });
    return () => {
      alive = false;
    };
  }, [storageKey]);
  useEffect(() => {
    if (restored) {
      const value = JSON.stringify({
        rows,
        category,
        metadata,
        baseUpdatedAt: initial?.updatedAt,
      });
      storageQueue.current = storageQueue.current
        .then(() => {
          if (editorMounted.current)
            return AsyncStorage.setItem(storageKey, value);
        })
        .catch(() => {});
    }
  }, [rows, category, metadata, restored, storageKey]);
  async function discard() {
    await storageQueue.current;
    await AsyncStorage.removeItem(storageKey);
    onCancel();
  }
  if (!restored) return <Busy />;
  function update(index: number, change: Partial<RowData>) {
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...change } : row)),
    );
  }
  function add(e: Exercise) {
    if (!rows.some((row) => row.exerciseId === e._id))
      setRows((previous) => [
        ...previous,
        {
          exerciseId: e._id,
          name: e.name,
          training:
            e.exerciseType === "cardio"
              ? { format: "cardio", durationSeconds: 600 }
              : { format: "strength" },
          plannedSets:
            e.exerciseType === "cardio" ? [] : [{ reps: null, weight: null }],
        },
      ]);
    setChoose(false);
  }
  if (choose)
    return (
      <>
        <Action onPress={() => setChoose(false)}>Back</Action>
        <ExerciseBrowser
          scope="template-editor"
          selected={rows.map((r) => r.exerciseId)}
          onChoose={add}
        />
      </>
    );
  return (
    <>
      <Row>
        {categories.map((value) => (
          <Action
            key={value}
            selected={category === value}
            onPress={() => setCategory(value as typeof category)}
          >
            {value}
          </Action>
        ))}
      </Row>
      {rows.map((row, index) => (
        <Card key={row.exerciseId}>
          <Txt title literal>
            {row.name}
          </Txt>
          {Object.entries(fieldErrors)
            .filter(
              ([path]) =>
                (path === `exercises.${index}` ||
                  path.startsWith(`exercises.${index}.`)) &&
                !path.includes(".plannedSets."),
            )
            .map(([path, message]) => (
              <Txt error key={path}>
                {message}
              </Txt>
            ))}
          <Row>
            <Action
              disabled={index === 0}
              onPress={() =>
                setRows((previous) => {
                  const next = [...previous];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  return next;
                })
              }
            >
              Move up
            </Action>
            <Action
              disabled={index === rows.length - 1}
              onPress={() =>
                setRows((previous) => {
                  const next = [...previous];
                  [next[index + 1], next[index]] = [
                    next[index],
                    next[index + 1],
                  ];
                  return next;
                })
              }
            >
              Move down
            </Action>
            <Action
              onPress={() =>
                setRows((previous) => previous.filter((_, i) => i !== index))
              }
            >
              Remove exercise
            </Action>
          </Row>
          <TrainingActivity
            building
            initial={row.training}
            exerciseId={row.exerciseId}
            activeId={null}
            onStart={() => {}}
            onDirty={(value) =>
              setDirty((previous) => ({ ...previous, [row.exerciseId]: value }))
            }
            onSave={async (training) =>
              update(index, {
                training,
                plannedSets:
                  training.format === "strength" ? row.plannedSets : [],
              })
            }
          />
          {(!row.training || row.training.format === "strength") && (
            <>
              {row.plannedSets.map((set, setIndex) => (
                <Card key={setIndex}>
                  {(["weight", "reps", "restSeconds"] as const).map((field) => (
                    <Field
                      key={field}
                      error={
                        fieldErrors[
                          `exercises.${index}.plannedSets.${setIndex}.${field}`
                        ]
                      }
                      focusRequest={fieldErrors}
                      focus={
                        focusPath ===
                        `exercises.${index}.plannedSets.${setIndex}.${field}`
                      }
                      title={field}
                      keyboardType="decimal-pad"
                      value={set[field] == null ? "" : String(set[field])}
                      onChangeText={(value) => {
                        const n = value === "" ? null : value.replace(",", ".");
                        update(index, {
                          plannedSets: row.plannedSets.map((s, i) =>
                            i === setIndex ? { ...s, [field]: n } : s,
                          ),
                        });
                      }}
                    />
                  ))}
                  <Field
                    title="Notes"
                    error={
                      fieldErrors[
                        `exercises.${index}.plannedSets.${setIndex}.notes`
                      ]
                    }
                    focusRequest={fieldErrors}
                    focus={
                      focusPath ===
                      `exercises.${index}.plannedSets.${setIndex}.notes`
                    }
                    value={set.notes ?? ""}
                    maxLength={200}
                    onChangeText={(notes) =>
                      update(index, {
                        plannedSets: row.plannedSets.map((s, i) =>
                          i === setIndex ? { ...s, notes } : s,
                        ),
                      })
                    }
                  />
                  <Action
                    onPress={() =>
                      update(index, {
                        plannedSets: row.plannedSets.filter(
                          (_, i) => i !== setIndex,
                        ),
                      })
                    }
                  >
                    Remove set
                  </Action>
                </Card>
              ))}
              <Action
                onPress={() =>
                  update(index, {
                    plannedSets: [
                      ...row.plannedSets,
                      { reps: null, weight: null },
                    ],
                  })
                }
              >
                Add set
              </Action>
            </>
          )}
        </Card>
      ))}
      <Action
        disabled={Object.values(dirty).some(Boolean)}
        onPress={() => setChoose(true)}
      >
        Add exercise
      </Action>
      {admin && (
        <Form
          button="Add exercise by ID"
          fields={[
            {
              name: "exerciseId",
              title: "Exercise ID",
              required: true,
              pattern: /^[a-f\d]{24}$/i,
            },
          ]}
          submit={async ({ exerciseId }) => {
            if (rows.some((row) => row.exerciseId === exerciseId))
              throw new Error("A template cannot contain duplicate exercises");
            setRows((previous) => [
              ...previous,
              {
                exerciseId,
                name: exerciseId,
                plannedSets: [{ weight: 0, reps: 10 }],
                training: { format: "strength" },
              },
            ]);
          }}
        />
      )}
      <Form
        fields={[
          {
            name: "name",
            title: "Name",
            value: metadata.name,
            required: true,
            min: 2,
            max: 80,
          },
          {
            name: "description",
            title: "Description",
            value: metadata.description,
            max: 500,
            multiline: true,
          },
        ]}
        onCancel={() => void discard()}
        onValuesChange={setMetadata}
        onFieldErrors={(errors, focusAllowed) => {
          const paths = Object.keys(errors).filter((path) =>
            path.startsWith("exercises."),
          );
          setFieldErrors(errors);
          setFocusPath(focusAllowed ? (paths[0] ?? "") : "");
          return paths.length > 0;
        }}
        submit={async (values) => {
          if (!rows.length)
            throw new Error("At least one exercise is required");
          if (rows.some((row) => dirty[row.exerciseId]))
            throw new Error("Save configuration before continuing");
          const errors: Record<string, string> = {};
          rows.forEach((row, i) =>
            row.plannedSets.forEach((set, j) => {
              for (const field of ["weight", "reps", "restSeconds"] as const) {
                const value = set[field];
                if (value == null || value === "") continue;
                const n = Number(value);
                if (!Number.isFinite(n))
                  errors[`exercises.${i}.plannedSets.${j}.${field}`] = t(
                    "formValidation.enterAValidNumber",
                  );
                else if (n < 0)
                  errors[`exercises.${i}.plannedSets.${j}.${field}`] = t(
                    "formValidation.enterAValueOfValueOrMore",
                    { value0: 0 },
                  );
                else if (field !== "weight" && !Number.isInteger(n))
                  errors[`exercises.${i}.plannedSets.${j}.${field}`] = t(
                    "formValidation.enterAWholeNumber",
                  );
              }
            }),
          );
          if (Object.keys(errors).length)
            throw new ApiError("Validation error", 400, errors);
          await onSave({
            ...values,
            category,
            exercises: rows.map(({ name: _name, ...row }) => ({
              ...row,
              plannedSets: row.plannedSets.map((set) => {
                const normalized: WorkoutTemplateSet = { notes: set.notes };
                for (const field of [
                  "weight",
                  "reps",
                  "restSeconds",
                ] as const) {
                  const value = set[field];
                  const n =
                    value == null || value === "" ? null : Number(value);
                  if (n !== null && (!Number.isFinite(n) || n < 0))
                    throw new Error("Enter a valid number");
                  normalized[field] = n;
                }
                return normalized;
              }),
            })),
          });
          await storageQueue.current;
          await AsyncStorage.removeItem(storageKey);
        }}
      />
    </>
  );
}
