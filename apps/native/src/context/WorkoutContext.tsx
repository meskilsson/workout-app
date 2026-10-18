import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { AppState } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  cardioCompletion,
  restAfterSupersetSet,
  finishWorkoutTransaction,
  FinishWorkoutError,
  cardioEvents,
  cardioTimerAction,
  createCardioTimer,
  latestFreshEvent,
  reconcileCardioTimer,
  type CardioTimerState,
  type TrainingConfig,
  type TimerEvent,
} from "@workout-app/shared";
import { t } from "../i18n";
import { useAuth } from "./AuthContext";
import { usePreferences } from "./PreferencesContext";
import { apiFetch } from "../services/apiClient";
import type { WorkoutDraft } from "../services/workoutDraftApi";
import { firstInvalidSet } from "../state/setValidation";
import { recoverDraft } from "../state/recovery";
import {
  cancelAlerts,
  cancelCue,
  scheduleAlerts,
  foregroundCue,
} from "../services/nativeAlerts";
import {
  workoutTimerReducer,
  createWorkoutTimerInitialState,
  type WorkoutTimerState,
} from "@workout-app/shared/timer";

type Entry = { state: CardioTimerState; config: TrainingConfig; runId: string };
type Snapshot = {
  draft: WorkoutDraft | null;
  completed: Record<string, boolean>;
  cardio: Record<string, Entry>;
  duration: WorkoutTimerState;
  rest: { end: number | null; remaining: number; runId: string };
};
const empty = (): Snapshot => ({
  draft: null,
  duration: createWorkoutTimerInitialState(),
  completed: {},
  cardio: {},
  rest: { end: null, remaining: 0, runId: Crypto.randomUUID() },
});
type CardioAction = Parameters<typeof cardioTimerAction>[2];
type ContextValue = Snapshot & {
  invalidSet: ReturnType<typeof firstInvalidSet>;
  now: number;
  busy: boolean;
  ready: boolean;
  error: string;
  setError: (v: string) => void;
  change: (fn: (s: Snapshot) => Snapshot) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => Promise<void>;
  request: <T>(path: string, method?: string, body?: unknown) => Promise<T>;
  mutate: (suffix: string, body?: unknown, method?: string) => Promise<void>;
  adopt: (draft: WorkoutDraft) => void;
  clear: () => void;
  restAction: (action: "start" | "pause" | "resume" | "reset") => void;
  cardioAction: (
    id: string,
    config: TrainingConfig,
    action: CardioAction,
  ) => void;
  saveSets: () => Promise<void>;
  finish: () => Promise<string>;
  configure: (exerciseId: string, training: TrainingConfig) => Promise<void>;
  completeSet: (exerciseId: string, index: number) => void;
};
const Context = createContext<ContextValue | null>(null);
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const prefs = usePreferences();
  const [snapshot, setSnapshot] = useState(empty),
    [now, setNow] = useState(Date.now),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [invalidSet, setInvalidSet] =
    useState<ReturnType<typeof firstInvalidSet>>(null);
  const autosaveQueue = useRef(Promise.resolve());
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const restoredKey = useRef<string | null>(null);
  const current = useRef(snapshot),
    guard = useRef(false),
    observed = useRef(Date.now()),
    appState = useRef(AppState.currentState),
    writeQueue = useRef(Promise.resolve()),
    generation = useRef(0);
  const key = user ? `workout:${user._id}` : null;
  function change(fn: (s: Snapshot) => Snapshot) {
    const next = fn(current.current);
    current.current = next;
    setSnapshot(next);
  }
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const epoch = generation.current;
    const result = await apiFetch<T>(
      path.startsWith("/api") ? path : `/api/workout-drafts${path}`,
      {
        token,
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    if (epoch !== generation.current) throw new Error("Session changed");
    return result;
  }
  function adopt(draft: WorkoutDraft) {
    cancelCue();
    change((s) => {
      const next =
        draft._id === s.draft?._id ? { ...s, draft } : { ...empty(), draft };
      next.cardio = Object.fromEntries(
        Object.entries(next.cardio).filter(
          ([id, entry]) =>
            draft.status === "active" &&
            draft.exercises.some(
              (e) =>
                e.exerciseId === id &&
                JSON.stringify(e.training) === JSON.stringify(entry.config),
            ),
        ),
      );
      const ids = new Set(
        draft.exercises.flatMap((e) =>
          e.sets.map((set, i) => set.id ?? `${e.exerciseId}:${i}`),
        ),
      );
      next.completed = Object.fromEntries(
        Object.entries(next.completed).filter(([id]) => ids.has(id)),
      );
      if (draft.status === "active" && next.duration.startTime === null)
        next.duration = workoutTimerReducer(next.duration, { type: "START" });
      return next;
    });
  }
  function clear() {
    change(() => empty());
    void cancelAlerts();
  }
  async function reload() {
    if (!ready) {
      setRestoreAttempt((n) => n + 1);
      return;
    }
    const draft = await request<WorkoutDraft | null>("/current");
    if (draft && (draft.status === "active" || draft.status === "building"))
      adopt(draft);
    else clear();
  }
  useEffect(() => {
    const epoch = ++generation.current;
    let alive = true;
    restoredKey.current = null;
    setReady(false);
    setError("");
    change(() => empty());
    if (!key || !token) {
      setReady(true);
      return;
    }
    void (async () => {
      let saved: Snapshot | null = null;
      try {
        saved = JSON.parse((await AsyncStorage.getItem(key)) ?? "null");
      } catch {
        /* Recovery can use the API. */
      }
      try {
        const draft = await request<WorkoutDraft | null>("/current");
        if (!alive || generation.current !== epoch) return;
        if (draft && ["active", "building"].includes(draft.status)) {
          const safe = recoverDraft(saved, draft, user!._id);
          if (!safe) throw new Error("Could not restore workout");
          const recovered = safe.matching ? saved : null;
          const cardio = safe.cardio;
          change(() => ({
            ...empty(),
            draft: safe.draft,
            duration:
              recovered?.duration &&
              Number.isFinite(recovered.duration.elapsedTime)
                ? recovered.duration
                : draft.status === "active"
                  ? workoutTimerReducer(createWorkoutTimerInitialState(), {
                      type: "START",
                    })
                  : createWorkoutTimerInitialState(),
            completed: safe.completed,
            cardio,
            rest:
              recovered?.rest &&
              Number.isFinite(recovered.rest.remaining) &&
              (recovered.rest.end === null ||
                Number.isFinite(recovered.rest.end))
                ? recovered.rest
                : empty().rest,
          }));
        }
        restoredKey.current = key;
        setReady(true);
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "Could not restore workout",
          );
      } finally {
        if (alive) {
          observed.current = Date.now();
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [key, restoreAttempt]);
  useEffect(() => {
    if (!key || !ready || restoredKey.current !== key) return;
    const value = JSON.stringify(snapshot),
      epoch = generation.current;
    writeQueue.current = writeQueue.current
      .then(() => {
        if (epoch === generation.current)
          return AsyncStorage.setItem(key, value);
      })
      .catch(() => setError("Could not save workout recovery data."));
  }, [snapshot, key, ready]);
  function events(s: Snapshot): TimerEvent[] {
    return [
      ...(s.rest.end
        ? [{ id: s.rest.runId, at: s.rest.end, cue: "rest-end" as const }]
        : []),
      ...Object.entries(s.cardio).flatMap(([id, entry]) =>
        cardioEvents(entry.runId, entry.state, entry.config, id),
      ),
    ];
  }
  useEffect(() => {
    const tick = (alert: boolean) => {
      const time = Date.now(),
        s = current.current;
      const cue = alert
        ? latestFreshEvent(events(s), observed.current, time)
        : undefined;
      observed.current = time;
      const cardio = Object.fromEntries(
        Object.entries(s.cardio).map(([id, entry]) => [
          id,
          {
            ...entry,
            state: reconcileCardioTimer(entry.state, entry.config, time),
          },
        ]),
      );
      if (
        Object.keys(cardio).some(
          (id) => cardio[id].state !== s.cardio[id].state,
        ) ||
        (s.rest.end !== null && s.rest.end <= time)
      )
        change((prev) => ({
          ...prev,
          cardio,
          rest:
            prev.rest.end && prev.rest.end <= time
              ? { ...prev.rest, end: null, remaining: 0 }
              : prev.rest,
        }));
      if (s.draft?.status === "active") setNow(time);
      if (cue && appState.current === "active") void foregroundCue(prefs, cue);
    };
    const interval = setInterval(
      () => tick(appState.current === "active"),
      250,
    );
    const subscription = AppState.addEventListener("change", (state) => {
      appState.current = state;
      tick(false);
      void scheduleAlerts(events(current.current), prefs);
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [prefs.sound, prefs.vibration, prefs.notifications, prefs.language]);
  useEffect(() => {
    if (!ready) return;
    // Schedule while JavaScript is awake. The native notification handler suppresses
    // foreground delivery while the same timeline supplies the in-app cue.
    void scheduleAlerts(events(snapshot), prefs);
  }, [snapshot, ready, prefs.notifications, prefs.sound, prefs.vibration]);
  useEffect(() => {
    if (snapshot.draft?.status === "active" && prefs.keepAwake)
      void activateKeepAwakeAsync("workout").catch(() => {});
    else void deactivateKeepAwake("workout");
    return () => {
      void deactivateKeepAwake("workout");
    };
  }, [snapshot.draft?.status, prefs.keepAwake]);
  async function run(fn: () => Promise<void>) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  async function mutate(suffix: string, body?: unknown, method = "PATCH") {
    if (!current.current.draft) throw new Error("Missing workout draft");
    const result = await request<WorkoutDraft>(
      `/${current.current.draft._id}${suffix}`,
      method,
      body,
    );
    adopt(result);
  }
  async function configure(exerciseId: string, training: TrainingConfig) {
    if (guard.current) throw new Error("Wait for the current save to finish");
    guard.current = true;
    setBusy(true);
    try {
      await saveSets();
      await mutate("/training", { exerciseId, training });
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  function completeSet(exerciseId: string, index: number) {
    const snapshot = current.current,
      draft = snapshot.draft;
    const exercise = draft?.exercises.find((e) => e.exerciseId === exerciseId),
      set = exercise?.sets[index];
    if (!draft || !exercise || !set) return;
    const invalid = firstInvalidSet({ exercises: [exercise] });
    if (invalid) {
      setInvalidSet(invalid);
      setError(invalid.message);
      return;
    }
    if (
      set.weight === null ||
      set.weight === "" ||
      set.reps === null ||
      set.reps === ""
    ) {
      const field =
        set.weight === null || set.weight === "" ? "weight" : "reps";
      const message = t("WorkoutPage.addWeightAndRepsBeforeCompletingTheSet");
      setInvalidSet({ id: `${exerciseId}:${index}:${field}`, field, message });
      setError(message);
      return;
    }
    setInvalidSet(null);
    setError("");
    cancelCue();
    const id = set.id ?? `${exerciseId}:${index}`;
    const rows = Object.fromEntries(
      draft.exercises.map((e) => [
        e.exerciseId,
        e.sets.map((s, i) => ({
          id: s.id ?? `${e.exerciseId}:${i}`,
          isWarmup: s.isWarmup,
          isCompleted: !!snapshot.completed[s.id ?? `${e.exerciseId}:${i}`],
        })),
      ]),
    );
    const shouldRest =
      snapshot.completed[id] ||
      restAfterSupersetSet(
        draft.exercises.map((e) => ({
          _id: e.exerciseId,
          supersetId: e.supersetId,
        })),
        rows,
        exerciseId,
        index,
      );
    const time = Date.now();
    change((s) => ({
      ...s,
      completed: { ...s.completed, [id]: true },
      cardio: Object.fromEntries(
        Object.entries(s.cardio).map(([key, entry]) => [
          key,
          {
            ...entry,
            runId: Crypto.randomUUID(),
            state: cardioTimerAction(entry.state, entry.config, "pause", time),
          },
        ]),
      ),
    }));
    if (shouldRest) restAction("start");
  }
  function restAction(action: "start" | "pause" | "resume" | "reset") {
    cancelCue();
    const time = Date.now();
    change((s) => ({
      ...s,
      cardio:
        action === "start"
          ? Object.fromEntries(
              Object.entries(s.cardio).map(([id, e]) => [
                id,
                {
                  ...e,
                  runId: Crypto.randomUUID(),
                  state: cardioTimerAction(e.state, e.config, "pause", time),
                },
              ]),
            )
          : s.cardio,
      rest: {
        runId: Crypto.randomUUID(),
        end:
          action === "start"
            ? time + prefs.restSeconds * 1000
            : action === "resume"
              ? time + s.rest.remaining
              : null,
        remaining:
          action === "start" || action === "reset"
            ? prefs.restSeconds * 1000
            : s.rest.end
              ? Math.max(0, s.rest.end - time)
              : s.rest.remaining,
      },
    }));
  }
  function cardioAction(
    id: string,
    config: TrainingConfig,
    action: CardioAction,
  ) {
    cancelCue();
    const time = Date.now();
    change((s) => {
      const cardio = { ...s.cardio };
      if (action === "start" || action === "resume")
        for (const [key, entry] of Object.entries(cardio))
          cardio[key] = {
            ...entry,
            runId: Crypto.randomUUID(),
            state: cardioTimerAction(entry.state, entry.config, "pause", time),
          };
      const entry = cardio[id];
      cardio[id] = {
        config,
        runId: Crypto.randomUUID(),
        state: cardioTimerAction(
          entry && JSON.stringify(entry.config) === JSON.stringify(config)
            ? entry.state
            : createCardioTimer(),
          config,
          action,
          time,
        ),
      };
      return {
        ...s,
        cardio,
        rest: action === "start" || action === "resume" ? empty().rest : s.rest,
      };
    });
  }
  async function saveSets() {
    const draft = current.current.draft;
    if (!draft) throw new Error("Missing workout draft");
    const invalid = firstInvalidSet(draft);
    setInvalidSet(invalid);
    if (invalid) throw new Error(invalid.message);
    const epoch = generation.current;
    const save = async () => {
      if (generation.current !== epoch) return;
      for (const exercise of draft.exercises)
        if (!exercise.training || exercise.training.format === "strength")
          await request(`/${draft._id}/sets`, "PATCH", {
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
          });
    };
    autosaveQueue.current = autosaveQueue.current.catch(() => {}).then(save);
    await autosaveQueue.current;
  }
  useEffect(() => {
    if (!ready || !snapshot.draft || !restoredKey.current) return;
    const timer = setTimeout(() => {
      if (!guard.current) void saveSets().catch((e) => setError(e.message));
    }, 800);
    return () => clearTimeout(timer);
  }, [snapshot.draft?.exercises, ready]);
  async function finish() {
    const draft = current.current.draft;
    if (!draft) throw new Error("Missing workout draft");
    let id: string;
    try {
      id = await finishWorkoutTransaction({
        readDraft: () => request<WorkoutDraft>(`/${draft._id}`),
        save: async () => {
          await saveSets();
          for (const exercise of draft.exercises)
            if (exercise.training && exercise.training.format !== "strength") {
              const entry = current.current.cardio[exercise.exerciseId];
              const completion = entry
                ? cardioCompletion(
                    reconcileCardioTimer(entry.state, entry.config, Date.now()),
                    entry.config,
                  )
                : exercise.cardioCompletion;
              if (!completion)
                throw new Error(
                  `Complete cardio for ${exercise.exerciseName} before ending the workout`,
                );
              await request(`/${draft._id}/training`, "PATCH", {
                exerciseId: exercise.exerciseId,
                training: exercise.training,
                cardioCompletion: completion,
              });
            }
        },
        complete: () =>
          request<{ _id: string }>(`/${draft._id}/complete`, "POST"),
      });
    } catch (error) {
      if (error instanceof FinishWorkoutError) {
        const keys = {
          "missing-session":
            "finishWorkout.theCompletedWorkoutCouldNotBeFoundPleaseTry",
          inactive: "finishWorkout.thisWorkoutIsNoLongerActive",
          unconfirmed:
            "finishWorkout.couldNotConfirmWhetherTheWorkoutFinishedYourProgress",
        };
        throw new Error(t(keys[error.code]));
      }
      throw error;
    }
    clear();
    return id;
  }
  return (
    <Context.Provider
      value={{
        ...snapshot,
        invalidSet,
        now,
        busy,
        ready,
        error,
        setError,
        change,
        run,
        reload,
        request,
        mutate,
        adopt,
        clear,
        restAction,
        cardioAction,
        saveSets,
        finish,
        configure,
        completeSet,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkout() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkoutProvider missing");
  return value;
}
