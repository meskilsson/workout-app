import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import {
  workoutTimerReducer,
  formatElapsedMilliseconds,
} from "@workout-app/shared/timer";
import { useCallback, useState } from "react";
import * as Crypto from "expo-crypto";
import {
  cardioTimerView,
  createCardioTimer,
  formatTrainingSeconds,
  supersetPairs,
  workoutGroups,
  type TrainingConfig,
  type Exercise,
} from "@workout-app/shared";
import {
  Page,
  Txt,
  Card,
  Action,
  Row,
  Field,
  Busy,
  confirm,
  Form,
} from "../components/ui";
import ExerciseBrowser from "../components/ExerciseBrowser";
import TrainingActivity from "../components/TrainingActivity";
import { useWorkout } from "../context/WorkoutContext";
import type { WorkoutDraft } from "../services/workoutDraftApi";
import { t, label } from "../i18n";

export default function StartWorkoutScreen({
  navigation,
}: {
  navigation: any;
}) {
  const w = useWorkout();
  const [muscles, setMuscles] = useState<string[]>([]),
    [includeCardio, setIncludeCardio] = useState(false),
    [choose, setChoose] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [replace, setReplace] = useState<string | null>(null),
    [pair, setPair] = useState<string | null>(null),
    [template, setTemplate] = useState(false),
    [templateCategory, setTemplateCategory] = useState("custom"),
    [dirty, setDirty] = useState<Record<string, boolean>>({});
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (choose) {
            setChoose(false);
            setReplace(null);
            return true;
          }
          if (pair) {
            setPair(null);
            return true;
          }
          if (template) {
            setTemplate(false);
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [choose, pair, template]),
  );
  const draft = w.draft;
  const groups = workoutGroups(
    (draft?.exercises ?? []).map((e) => ({ ...e, _id: e.exerciseId })),
  );
  const displayExercises = groups.flat();
  const groupIndex = (id: string) =>
    groups.findIndex((group) => group.some((e) => e.exerciseId === id));
  const active = draft?.status === "active";
  function select(exercise: Exercise) {
    if (replace) {
      void w.run(async () => {
        await w.saveSets();
        await w.mutate(`/exercises/${replace}/replace`, {
          replacementExerciseId: exercise._id,
        });
        setChoose(false);
        setReplace(null);
      });
    } else
      setSelected((previous) =>
        previous.includes(exercise._id)
          ? previous.filter((id) => id !== exercise._id)
          : [...previous, exercise._id],
      );
  }
  function updateSet(
    exerciseId: string,
    index: number,
    field: "weight" | "reps",
    text: string,
  ) {
    const number = text === "" ? null : text.replace(",", ".");
    w.change((s) => ({
      ...s,
      draft: s.draft
        ? {
            ...s.draft,
            exercises: s.draft.exercises.map((e) =>
              e.exerciseId === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((set, i) =>
                      i === index ? { ...set, [field]: number } : set,
                    ),
                  }
                : e,
            ),
          }
        : null,
    }));
  }
  async function move(index: number, delta: number) {
    if (!draft) return;
    await w.saveSets();
    const from = groupIndex(displayExercises[index].exerciseId),
      target = from + delta;
    if (target < 0 || target >= groups.length) return;
    const ordered = [...groups];
    [ordered[from], ordered[target]] = [ordered[target], ordered[from]];
    await w.mutate("/exercises/order", {
      exerciseIds: ordered.flat().map((e) => e.exerciseId),
    });
  }
  async function link(id: string, partner?: string) {
    if (!draft) return;
    await w.saveSets();
    const pairs = supersetPairs(
      draft.exercises.map((e) => ({ ...e, _id: e.exerciseId })),
    ).filter((p) => !p.includes(id));
    if (partner) pairs.push([id, partner]);
    await w.mutate("/supersets", { pairs });
    setPair(null);
  }
  if (!w.ready)
    return (
      <Page>
        {w.error ? (
          <>
            <Txt error>{w.error}</Txt>
            <Action onPress={() => void w.reload()}>Try again</Action>
          </>
        ) : (
          <Busy />
        )}
      </Page>
    );
  if (choose && draft)
    return (
      <Page>
        <Txt title>{replace ? "Replace exercise" : "Select exercises"}</Txt>
        <Action
          disabled={w.busy}
          onPress={() => {
            setChoose(false);
            setReplace(null);
          }}
        >
          Back
        </Action>
        <ExerciseBrowser
          scope={`draft:${draft._id}`}
          initialMuscles={draft.selectedMuscleGroups}
          includeCardio={
            (draft as WorkoutDraft & { includeCardio?: boolean }).includeCardio
          }
          selected={selected}
          onChoose={select}
        />
        {!replace && (
          <Action
            disabled={w.busy || !selected.length}
            onPress={() =>
              void w.run(async () => {
                await w.saveSets();
                await w.mutate(
                  draft.exercises.length ? "/exercises/add" : "/exercises",
                  { exerciseIds: selected },
                );
                setChoose(false);
                setSelected([]);
              })
            }
          >
            Save exercises
          </Action>
        )}
        {w.error ? <Txt error>{w.error}</Txt> : null}
      </Page>
    );
  return (
    <Page>
      <Txt title>
        {active
          ? "Active workout"
          : draft
            ? "Workout summary"
            : "Start your workout"}
      </Txt>
      {w.error ? <Txt error>{w.error}</Txt> : null}
      {!draft ? (
        <>
          <Txt>Choose the muscle groups you want to train.</Txt>
          <Row>
            {(
              [
                "legs",
                "back",
                "chest",
                "shoulders",
                "biceps",
                "triceps",
                "core",
              ] as const
            ).map((muscle) => (
              <Action
                key={muscle}
                selected={muscles.includes(muscle)}
                onPress={() =>
                  setMuscles((previous) =>
                    previous.includes(muscle)
                      ? previous.filter((m) => m !== muscle)
                      : [...previous, muscle],
                  )
                }
              >
                {muscle}
              </Action>
            ))}
          </Row>
          <Action
            selected={includeCardio}
            onPress={() => setIncludeCardio(!includeCardio)}
          >
            Include cardio
          </Action>
          <Action
            disabled={w.busy || (!muscles.length && !includeCardio)}
            onPress={() =>
              void w.run(async () => {
                w.adopt(
                  await w.request<WorkoutDraft>("", "POST", {
                    selectedMuscleGroups: muscles.flatMap((m) =>
                      m === "legs"
                        ? ["quads", "hamstrings", "glutes", "calves"]
                        : [m],
                    ),
                    includeCardio,
                    purpose: "workout",
                  }),
                );
                setChoose(true);
              })
            }
          >
            Choose exercises
          </Action>
        </>
      ) : (
        <>
          <Txt>{draft.selectedMuscleGroups.join(" · ")}</Txt>
          {active && (
            <Card>
              <Txt>{`${t("common.duration")}: ${formatElapsedMilliseconds(w.duration.elapsedTime + (w.duration.isRunning && w.duration.lastTickAt !== null ? Math.max(0, w.now - w.duration.lastTickAt) : 0))}`}</Txt>
              <Row>
                {(["START", "PAUSE", "RESET"] as const).map((type) => (
                  <Action
                    key={type}
                    onPress={() =>
                      w.change((s) => ({
                        ...s,
                        duration: workoutTimerReducer(s.duration, { type }),
                      }))
                    }
                  >
                    {type.toLowerCase()}
                  </Action>
                ))}
              </Row>
              <Txt>{`${t("common.restTimer")}: ${formatTrainingSeconds((w.rest.end ? Math.max(0, w.rest.end - w.now) : w.rest.remaining) / 1000)}`}</Txt>
              <Row>
                {(["start", "pause", "resume", "reset"] as const).map(
                  (action) => (
                    <Action
                      key={action}
                      disabled={
                        action === "pause"
                          ? w.rest.end === null
                          : action === "resume"
                            ? w.rest.end !== null || w.rest.remaining <= 0
                            : false
                      }
                      onPress={() => w.restAction(action)}
                    >
                      {action}
                    </Action>
                  ),
                )}
              </Row>
            </Card>
          )}
          {displayExercises.map((exercise, index) => (
            <Card key={exercise.exerciseId}>
              <Txt title literal>
                {exercise.exerciseName}
              </Txt>
              {exercise.supersetId && <Txt>Superset</Txt>}
              <Row>
                <Action
                  disabled={w.busy || groupIndex(exercise.exerciseId) === 0}
                  onPress={() => void w.run(() => move(index, -1))}
                >
                  Move up
                </Action>
                <Action
                  disabled={
                    w.busy ||
                    groupIndex(exercise.exerciseId) === groups.length - 1
                  }
                  onPress={() => void w.run(() => move(index, 1))}
                >
                  Move down
                </Action>
                <Action
                  disabled={w.busy}
                  onPress={() => {
                    setReplace(exercise.exerciseId);
                    setChoose(true);
                  }}
                >
                  Replace exercise
                </Action>
                <Action
                  disabled={w.busy || draft.exercises.length <= 1}
                  onPress={() =>
                    confirm(
                      "Remove exercise",
                      () =>
                        void w.run(async () => {
                          await w.saveSets();
                          await w.mutate(
                            `/exercises/${exercise.exerciseId}`,
                            undefined,
                            "DELETE",
                          );
                        }),
                    )
                  }
                >
                  Remove exercise
                </Action>
              </Row>
              {exercise.training && exercise.training.format !== "strength" ? (
                active ? (
                  <NativeCardio
                    onDirty={(value) =>
                      setDirty((previous) => ({
                        ...previous,
                        [exercise.exerciseId]: value,
                      }))
                    }
                    exerciseId={exercise.exerciseId}
                    config={exercise.training}
                  />
                ) : (
                  <TrainingActivity
                    cardioOnly
                    initial={exercise.training}
                    building
                    activeId={null}
                    exerciseId={exercise.exerciseId}
                    onStart={() => {}}
                    onDirty={(value) =>
                      setDirty((previous) => ({
                        ...previous,
                        [exercise.exerciseId]: value,
                      }))
                    }
                    onSave={async (training) => {
                      await w.configure(exercise.exerciseId, training);
                    }}
                  />
                )
              ) : (
                <>
                  {exercise.sets.map((set, setIndex) => {
                    const id = set.id ?? `${exercise.exerciseId}:${setIndex}`;
                    return (
                      <Card key={id}>
                        <Txt>{`${set.isWarmup ? t("workout.warmup") : t("common.set")} ${setIndex + 1}`}</Txt>
                        <Field
                          focusRequest={w.invalidSet}
                          focus={
                            w.invalidSet?.id ===
                            `${exercise.exerciseId}:${setIndex}:weight`
                          }
                          error={
                            w.invalidSet?.id ===
                            `${exercise.exerciseId}:${setIndex}:weight`
                              ? w.invalidSet.message
                              : undefined
                          }
                          title="Weight (kg)"
                          accessibilityLabel={`${exercise.exerciseName}, ${t("common.set")} ${setIndex + 1}, ${t("common.weight")}`}
                          keyboardType="decimal-pad"
                          editable={!w.busy}
                          value={set.weight === null ? "" : String(set.weight)}
                          onChangeText={(text) =>
                            updateSet(
                              exercise.exerciseId,
                              setIndex,
                              "weight",
                              text,
                            )
                          }
                        />
                        <Field
                          focusRequest={w.invalidSet}
                          focus={
                            w.invalidSet?.id ===
                            `${exercise.exerciseId}:${setIndex}:reps`
                          }
                          error={
                            w.invalidSet?.id ===
                            `${exercise.exerciseId}:${setIndex}:reps`
                              ? w.invalidSet.message
                              : undefined
                          }
                          title="Reps"
                          accessibilityLabel={`${exercise.exerciseName}, ${t("common.set")} ${setIndex + 1}, ${t("common.reps")}`}
                          keyboardType="number-pad"
                          editable={!w.busy}
                          value={set.reps === null ? "" : String(set.reps)}
                          onChangeText={(text) =>
                            updateSet(
                              exercise.exerciseId,
                              setIndex,
                              "reps",
                              text,
                            )
                          }
                        />
                        <Row>
                          {active && (
                            <Action
                              disabled={w.busy}
                              selected={!!w.completed[id]}
                              onPress={() =>
                                w.completeSet(exercise.exerciseId, setIndex)
                              }
                            >
                              {w.completed[id]
                                ? "Restart rest"
                                : "Complete set"}
                            </Action>
                          )}
                          <Action
                            disabled={w.busy}
                            onPress={() =>
                              w.change((s) => ({
                                ...s,
                                draft: s.draft
                                  ? {
                                      ...s.draft,
                                      exercises: s.draft.exercises.map((e) =>
                                        e.exerciseId === exercise.exerciseId
                                          ? {
                                              ...e,
                                              sets: e.sets.filter(
                                                (_, i) => i !== setIndex,
                                              ),
                                            }
                                          : e,
                                      ),
                                    }
                                  : null,
                              }))
                            }
                          >
                            Remove set
                          </Action>
                        </Row>
                      </Card>
                    );
                  })}
                  <Row>
                    {[false, true].map((isWarmup) => (
                      <Action
                        key={String(isWarmup)}
                        disabled={w.busy}
                        onPress={() =>
                          w.change((s) => ({
                            ...s,
                            draft: s.draft
                              ? {
                                  ...s.draft,
                                  exercises: s.draft.exercises.map((e) =>
                                    e.exerciseId === exercise.exerciseId
                                      ? {
                                          ...e,
                                          sets: [
                                            ...e.sets,
                                            {
                                              id: Crypto.randomUUID(),
                                              isWarmup,
                                              weight: null,
                                              reps: null,
                                            },
                                          ].sort(
                                            (a, b) =>
                                              Number(!!b.isWarmup) -
                                              Number(!!a.isWarmup),
                                          ),
                                        }
                                      : e,
                                  ),
                                }
                              : null,
                          }))
                        }
                      >
                        {isWarmup ? "Add warmup set" : "Add set"}
                      </Action>
                    ))}
                    <Action
                      disabled={w.busy}
                      onPress={() =>
                        exercise.supersetId
                          ? void w.run(() => link(exercise.exerciseId))
                          : setPair(exercise.exerciseId)
                      }
                    >
                      {exercise.supersetId
                        ? "Split superset"
                        : "Create superset"}
                    </Action>
                  </Row>
                </>
              )}
            </Card>
          ))}
          {pair && (
            <Card>
              <Txt>Choose superset partner</Txt>
              {draft.exercises
                .filter(
                  (e) =>
                    e.exerciseId !== pair &&
                    !e.supersetId &&
                    (!e.training || e.training.format === "strength"),
                )
                .map((e) => (
                  <Action
                    key={e.exerciseId}
                    disabled={w.busy}
                    onPress={() => void w.run(() => link(pair, e.exerciseId))}
                  >
                    {e.exerciseName}
                  </Action>
                ))}
              <Action onPress={() => setPair(null)}>Cancel</Action>
            </Card>
          )}
          <Action
            disabled={w.busy}
            onPress={() => {
              setSelected([]);
              setChoose(true);
            }}
          >
            Add exercises
          </Action>
          <Action disabled={w.busy} onPress={() => void w.run(w.saveSets)}>
            Save progress
          </Action>
          {!active && (
            <>
              <Action
                disabled={
                  w.busy ||
                  !draft.exercises.length ||
                  Object.values(dirty).some(Boolean)
                }
                onPress={() =>
                  void w.run(async () => {
                    await w.saveSets();
                    await w.mutate("/start");
                  })
                }
              >
                Start workout
              </Action>
              <Action onPress={() => setTemplate(!template)}>
                Save as template
              </Action>
              {template && (
                <>
                  <Row>
                    {[
                      "full_body",
                      "push",
                      "pull",
                      "legs",
                      "upper",
                      "lower",
                      "custom",
                    ].map((category) => (
                      <Action
                        key={category}
                        selected={templateCategory === category}
                        onPress={() => setTemplateCategory(category)}
                      >
                        {category}
                      </Action>
                    ))}
                  </Row>
                  <Form
                    fields={[
                      {
                        name: "name",
                        title: "Name",
                        required: true,
                        min: 2,
                        max: 80,
                      },
                      {
                        name: "description",
                        title: "Description",
                        multiline: true,
                        max: 500,
                      },
                    ]}
                    submit={async (values) => {
                      await w.saveSets();
                      await w.request(
                        `/api/workout-templates/from-draft/${draft._id}`,
                        "POST",
                        { ...values, category: templateCategory },
                      );
                      setTemplate(false);
                    }}
                  />
                </>
              )}
            </>
          )}
          {active && (
            <Action
              disabled={w.busy || Object.values(dirty).some(Boolean)}
              onPress={() =>
                confirm(
                  "Finish workout",
                  () =>
                    void w.run(async () => {
                      const sessionId = await w.finish();
                      navigation.navigate("Session", { sessionId });
                    }),
                )
              }
            >
              Finish workout
            </Action>
          )}
          <Action
            disabled={w.busy}
            onPress={() =>
              confirm(
                "Abandon workout",
                () =>
                  void w.run(async () => {
                    await w.mutate("/abandon");
                    w.clear();
                  }),
              )
            }
          >
            Abandon workout
          </Action>
        </>
      )}
    </Page>
  );
}
function NativeCardio({
  exerciseId,
  config,
  onDirty,
}: {
  exerciseId: string;
  config: TrainingConfig;
  onDirty: (value: boolean) => void;
}) {
  const w = useWorkout();
  const [options, setOptions] = useState(false);
  const entry = w.cardio[exerciseId];
  const state = entry?.state ?? createCardioTimer();
  const view = cardioTimerView(state, config, w.now);
  return (
    <>
      {state.status === "ready" && (
        <Action
          disabled={w.busy}
          onPress={() => {
            setOptions(!options);
            if (options) onDirty(false);
          }}
        >
          Edit configuration
        </Action>
      )}
      {options && state.status === "ready" && (
        <TrainingActivity
          cardioOnly
          building
          initial={config}
          exerciseId={exerciseId}
          activeId={null}
          onStart={() => {}}
          onDirty={onDirty}
          onSave={async (training) => {
            await w.configure(exerciseId, training);
            w.change((s) => {
              const cardio = { ...s.cardio };
              delete cardio[exerciseId];
              return { ...s, cardio };
            });
            setOptions(false);
          }}
        />
      )}
      <Txt live>
        {label(view.phase) +
          (config.format === "intervals"
            ? t("CardioSession.roundValueOfValue", {
                value0: view.round,
                value1: config.rounds,
              })
            : "")}
      </Txt>
      <Txt title>{formatTrainingSeconds(view.phaseRemaining)}</Txt>
      <Txt>{`${view.round} / ${config.format === "intervals" ? config.rounds : 1} · ${formatTrainingSeconds(view.remaining)}`}</Txt>
      <Row>
        {(state.status === "ready"
          ? ["start"]
          : state.status === "running"
            ? ["pause"]
            : state.status === "paused"
              ? ["resume"]
              : []
        ).map((action) => (
          <Action
            key={action}
            disabled={w.busy || options}
            onPress={() =>
              w.cardioAction(
                exerciseId,
                config,
                action as "start" | "pause" | "resume",
              )
            }
          >
            {action}
          </Action>
        ))}
        <Action
          disabled={w.busy}
          onPress={() => w.cardioAction(exerciseId, config, "reset")}
        >
          Reset session
        </Action>
        <Action
          disabled={w.busy || state.status === "completed"}
          onPress={() => w.cardioAction(exerciseId, config, "complete")}
        >
          Complete manually
        </Action>
      </Row>
    </>
  );
}
