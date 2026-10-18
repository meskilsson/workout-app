import {
  cardioCompletion,
  isCardioTimerState,
  trainingTotalSeconds,
  validateCardioCompletion,
  validateTraining,
  type CardioTimerState,
  type TrainingConfig,
  type TimerEvent,
} from "@workout-app/shared";
import type { WorkoutDraft } from "../services/workoutDraftApi";

export type CardioEntry = {
  config: TrainingConfig;
  state: CardioTimerState;
  runId: string;
};
export function recoverDraft(
  local: unknown,
  remote: WorkoutDraft | null,
  userId: string,
) {
  if (
    !remote ||
    remote.userId !== userId ||
    !["building", "active"].includes(remote.status) ||
    !Array.isArray(remote.exercises)
  )
    return null;
  const saved =
    local && typeof local === "object"
      ? (local as {
          draft?: WorkoutDraft;
          completed?: Record<string, boolean>;
          cardio?: Record<string, CardioEntry>;
        })
      : null;
  const matching =
    saved?.draft?._id === remote._id &&
    saved.draft.userId === userId &&
    Array.isArray(saved.draft.exercises);
  const draft = matching
    ? {
        ...remote,
        exercises: remote.exercises.map((exercise) => {
          const sets = saved!.draft!.exercises.find(
            (e) => e.exerciseId === exercise.exerciseId,
          )?.sets;
          const valid =
            Array.isArray(sets) &&
            sets.every(
              (s) =>
                s &&
                (s.id === undefined || typeof s.id === "string") &&
                (s.weight === null ||
                  typeof s.weight === "string" ||
                  (typeof s.weight === "number" &&
                    Number.isFinite(s.weight))) &&
                (s.reps === null ||
                  typeof s.reps === "string" ||
                  (typeof s.reps === "number" && Number.isFinite(s.reps))),
            );
          return valid ? { ...exercise, sets } : exercise;
        }),
      }
    : remote;
  const ids = new Set(
    draft.exercises.flatMap((e) =>
      e.sets.map((s, i) => s.id ?? `${e.exerciseId}:${i}`),
    ),
  );
  const completed = matching
    ? Object.fromEntries(
        Object.entries(saved?.completed ?? {}).filter(
          ([id, value]) => ids.has(id) && value === true,
        ),
      )
    : {};
  const cardio: Record<string, CardioEntry> = {};
  if (matching && remote.status === "active")
    for (const [id, entry] of Object.entries(saved?.cardio ?? {})) {
      try {
        const config = validateTraining(entry.config);
        if (
          !draft.exercises.some(
            (e) =>
              e.exerciseId === id &&
              JSON.stringify(e.training) === JSON.stringify(config),
          ) ||
          config.format === "strength" ||
          !isCardioTimerState(entry.state) ||
          entry.state.elapsedMs > trainingTotalSeconds(config) * 1000
        )
          continue;
        if (entry.state.status === "completed")
          validateCardioCompletion(
            cardioCompletion(entry.state, config),
            config,
          );
        if (typeof entry.runId === "string" && entry.runId.length <= 100)
          cardio[id] = { ...entry, config };
      } catch {
        /* Persisted data must never invent an activity completion. */
      }
    }
  if (remote.status === "active")
    for (const exercise of remote.exercises) {
      if (
        cardio[exercise.exerciseId] ||
        !exercise.cardioCompletion ||
        !exercise.training ||
        exercise.training.format === "strength"
      )
        continue;
      try {
        const completion = validateCardioCompletion(
          exercise.cardioCompletion,
          exercise.training,
        );
        cardio[exercise.exerciseId] = {
          config: exercise.training,
          runId: `restored:${exercise.exerciseId}`,
          state: {
            status: "completed",
            elapsedMs: completion.elapsedSeconds * 1000,
            startedAt: null,
            manual: completion.manual,
          },
        };
      } catch {
        /* Ignore malformed server completion. */
      }
    }
  return { draft, completed, cardio, matching };
}

export function notificationWindow(
  events: TimerEvent[],
  now: number,
  limit = 60,
): TimerEvent[] {
  const upcoming = [
    ...new Map(events.filter((e) => e.at > now).map((e) => [e.id, e])).values(),
  ].sort((a, b) => a.at - b.at);
  return upcoming.length > limit
    ? [...upcoming.slice(0, limit - 1), upcoming[upcoming.length - 1]]
    : upcoming;
}

/** Serial OS writes plus generation checks prevent late schedules surviving pause/logout. */
export class NotificationCoordinator {
  private revision = 0;
  private queue = Promise.resolve();
  constructor(
    private adapter: {
      cancel: () => Promise<void>;
      schedule: (event: TimerEvent) => Promise<void>;
    },
  ) {}
  replace(events: TimerEvent[]) {
    const revision = ++this.revision;
    const operation = async () => {
      await this.adapter.cancel();
      for (const event of events) {
        if (revision !== this.revision) return;
        await this.adapter.schedule(event);
      }
    };
    this.queue = this.queue.catch(() => {}).then(operation);
    return this.queue;
  }
  cancel() {
    return this.replace([]);
  }
}
