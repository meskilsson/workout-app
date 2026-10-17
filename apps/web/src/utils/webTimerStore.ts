import { cardioCompletion, cardioTimerAction, createCardioTimer, isCardioTimerState, reconcileCardioTimer, trainingTotalSeconds, validateCardioCompletion, validateTraining, type CardioCompletion, type CardioTimerState, type TrainingConfig } from '@workout-app/shared';
import { createRestTimerInitialState, restTimerReducer, type RestTimerAction, type RestTimerState } from '@workout-app/shared/timer/rest';
import { createWebRestTimerStorage, isWorkoutSnapshotCleared, readAllCardioSnapshots, readWebTimerSnapshot, writeWebTimerSnapshot } from './workoutProgressStorage';
import { cardioEvents, latestFreshEvent, type TimerEvent } from './timerTimeline';
import { timerIdentity } from './timerIdentity';

export type CardioEntry = { config: TrainingConfig; state: CardioTimerState; runId: string };
export type WebTimerSnapshot = { revision: number; rest: RestTimerState; restRunId: string; cardio: Record<string, CardioEntry> };
type CardioAction = Parameters<typeof cardioTimerAction>[2];
const id = timerIdentity;

export class WebTimerStore {
    private snapshot: WebTimerSnapshot;
    private listeners = new Set<() => void>();
    private observedAt: number;
    private queue = Promise.resolve();
    private active = true;
    readonly scope: string | null;
    readonly now: () => number;
    private readonly onEvent: (event: TimerEvent, revision: number) => void;
    constructor(scope: string | null, duration: number, now = Date.now,
        onEvent: (event: TimerEvent, revision: number) => void = () => {}) {
        this.scope = scope; this.now = now; this.onEvent = onEvent;
        this.observedAt = now();
        this.snapshot = { revision: 0, rest: createRestTimerInitialState(duration), restRunId: id(), cardio: {} };
        if (scope) {
            this.load();
            if (!this.snapshot.revision) {
                this.snapshot.rest = createWebRestTimerStorage(scope).load(duration);
                for (const [exerciseId, entry] of Object.entries(readAllCardioSnapshots(scope))) this.restoreEntry(exerciseId, entry);
            }
        }
        // Reload restores progress, never historical sound.
        this.reconcile(false);
    }
    private restoreEntry(exerciseId: string, value: unknown) {
        try {
            const entry = value as CardioEntry;
            const config = validateTraining(entry.config);
            if (config.format !== 'strength' && isCardioTimerState(entry.state) && entry.state.elapsedMs <= trainingTotalSeconds(config) * 1000) {
                if (entry.state.status === 'completed') validateCardioCompletion(cardioCompletion(entry.state, config), config);
                this.snapshot.cardio = { ...this.snapshot.cardio, [exerciseId]: { config, state: entry.state, runId: typeof entry.runId === 'string' && entry.runId.length <= 100 ? entry.runId : id() } };
            }
        } catch { /* Invalid persisted data cannot complete an activity. */ }
    }
    private load() {
        if (!this.scope) return;
        const value = readWebTimerSnapshot(this.scope) as WebTimerSnapshot | null;
        const rest = value?.rest;
        if (!value || !Number.isSafeInteger(value.revision) || value.revision <= this.snapshot.revision || !rest
            || typeof rest.isRunning !== 'boolean' || !Number.isFinite(rest.duration) || rest.duration <= 0 || rest.duration > 86400000
            || !Number.isFinite(rest.timeLeft) || rest.timeLeft < 0 || (rest.isRunning ? !Number.isFinite(rest.endTime) || rest.endTime === null : rest.endTime !== null)
            || typeof value.restRunId !== 'string' || !value.cardio || typeof value.cardio !== 'object') return;
        this.snapshot = { ...value, cardio: {} };
        for (const [key, entry] of Object.entries(value.cardio)) this.restoreEntry(key, entry);
    }
    getSnapshot = () => this.snapshot;
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    events = (): TimerEvent[] => [
        ...(this.snapshot.rest.isRunning && this.snapshot.rest.endTime !== null ? [{ id: this.snapshot.restRunId, at: this.snapshot.rest.endTime, cue: 'rest-end' as const }] : []),
        ...Object.entries(this.snapshot.cardio).flatMap(([key, entry]) => cardioEvents(entry.runId, entry.state, entry.config, key)),
    ];
    hasRunningCardio = () => Object.values(this.snapshot.cardio).some(entry => entry.state.status === 'running');
    isCurrent(revision: number) {
        const persisted = this.scope ? readWebTimerSnapshot(this.scope) as { revision?: number } | null : null;
        return this.active && revision === this.snapshot.revision && (!persisted?.revision || persisted.revision <= revision)
            && (!this.scope || !isWorkoutSnapshotCleared(this.scope));
    }
    private publish(changed: boolean) {
        if (changed) {
            this.snapshot = { ...this.snapshot, revision: Math.max(this.snapshot.revision + 1, this.now() * 1000) };
            if (this.scope) writeWebTimerSnapshot(this.scope, this.snapshot);
        }
        this.listeners.forEach(listener => listener());
    }
    private enqueue(change: () => void | boolean) {
        const perform = () => {
            if (!this.active || (this.scope && isWorkoutSnapshotCleared(this.scope))) return;
            this.load();
            if (change() === false) return;
            this.observedAt = this.now();
            this.publish(true);
        };
        this.queue = this.queue.then(() => typeof navigator !== 'undefined' && navigator.locks
            ? navigator.locks.request(`web-timers:${this.scope}`, perform) : perform()).catch(() => {});
        return this.queue;
    }
    restAction(action: RestTimerAction) {
        return this.enqueue(() => {
            const now = this.now();
            if (this.snapshot.rest.isRunning && this.snapshot.rest.endTime! <= now)
                this.snapshot = { ...this.snapshot, rest: { ...this.snapshot.rest, isRunning: false, timeLeft: 0, endTime: null } };
            if (action.type === 'START') this.pauseCardio(now);
            this.snapshot = { ...this.snapshot, rest: restTimerReducer(this.snapshot.rest, action), restRunId: id() };
        });
    }
    private pauseCardio(now: number, except?: string) {
        this.snapshot = { ...this.snapshot, cardio: Object.fromEntries(Object.entries(this.snapshot.cardio).map(([key, entry]) =>
            [key, key === except ? entry : { ...entry, state: cardioTimerAction(entry.state, entry.config, 'pause', now), runId: id() }])) };
    }
    pauseActivities() { return this.enqueue(() => this.pauseCardio(this.now())); }
    refreshSchedule() { return this.enqueue(() => {}); }
    register(exerciseId: string, config: TrainingConfig, completion?: CardioCompletion) {
        return this.enqueue(() => {
            const entry = this.snapshot.cardio[exerciseId];
            if (entry && JSON.stringify(entry.config) === JSON.stringify(config)) return false;
            this.snapshot = { ...this.snapshot, cardio: { ...this.snapshot.cardio, [exerciseId]: { config, runId: id(), state: completion
                ? { status: 'completed', elapsedMs: completion.elapsedSeconds * 1000, startedAt: null, manual: completion.manual } : createCardioTimer() } } };
        });
    }
    retainActivities(exerciseIds: string[]) {
        return this.enqueue(() => {
            if (Object.keys(this.snapshot.cardio).every(key => exerciseIds.includes(key))) return false;
            this.snapshot = { ...this.snapshot, cardio: Object.fromEntries(Object.entries(this.snapshot.cardio).filter(([key]) => exerciseIds.includes(key))) };
        });
    }
    cardioAction(exerciseId: string, action: CardioAction) {
        return this.enqueue(() => {
            const entry = this.snapshot.cardio[exerciseId];
            if (!entry) return;
            const now = this.now();
            if (action === 'start' || action === 'resume') {
                this.pauseCardio(now, exerciseId);
                this.snapshot = { ...this.snapshot, rest: createRestTimerInitialState(this.snapshot.rest.duration), restRunId: id() };
            }
            this.snapshot = { ...this.snapshot, cardio: { ...this.snapshot.cardio, [exerciseId]: { ...entry, runId: id(), state: cardioTimerAction(entry.state, entry.config, action, now) } } };
        });
    }
    completion(exerciseId: string) {
        const entry = this.snapshot.cardio[exerciseId];
        return entry ? cardioCompletion(reconcileCardioTimer(entry.state, entry.config, this.now()), entry.config) : undefined;
    }
    reconcile(alert = true) {
        if (!this.active || (this.scope && isWorkoutSnapshotCleared(this.scope))) return;
        const previous = this.snapshot;
        this.load();
        const now = this.now();
        const event = alert ? latestFreshEvent(this.events(), this.observedAt, now) : undefined;
        this.observedAt = now;
        let changed = false;
        const rest = this.snapshot.rest;
        if (rest.isRunning && rest.endTime! <= now) {
            this.snapshot = { ...this.snapshot, rest: { ...rest, timeLeft: 0, isRunning: false, endTime: null } }; changed = true;
        }
        for (const [key, entry] of Object.entries(this.snapshot.cardio)) {
            const state = reconcileCardioTimer(entry.state, entry.config, now);
            if (state !== entry.state) { this.snapshot = { ...this.snapshot, cardio: { ...this.snapshot.cardio, [key]: { ...entry, state } } }; changed = true; }
        }
        // Completion keeps its event identity; later user commands invalidate it.
        if (changed && this.scope) writeWebTimerSnapshot(this.scope, this.snapshot);
        if (changed || previous !== this.snapshot) this.publish(false);
        if (event) this.onEvent(event, this.snapshot.revision);
    }
    stop() { this.active = false; }
    activate() { this.active = true; this.observedAt = this.now(); this.reconcile(false); }
}
