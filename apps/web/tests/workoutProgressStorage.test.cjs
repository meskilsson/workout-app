const assert = require("node:assert/strict");
const { beforeEach, test } = require("node:test");
const { createElement } = require("react");
const { renderToString } = require("react-dom/server");
const {
    clearDraftSnapshots, clearUserSnapshots, createWebRestTimerStorage,
    restoreWorkoutSets, saveWorkoutSets, workoutScope,
} = require("../src/utils/workoutProgressStorage.ts");
const { useRestTimer } = require("../../../packages/shared/src/timer/rest/useRestTimer.ts");
const { isFreshWorkoutTimer } = require("../../../packages/shared/src/timer/workout/workoutTimer.utils.ts");
const { createWorkoutTimerInitialState, workoutTimerReducer } = require("../../../packages/shared/src/timer/workout/workoutTimer.reducer.ts");
const { updateWorkoutDraftSetsSchema } = require("../../backend/src/schemas/workoutDraft.schema.ts");

class MemoryStorage {
    data = new Map();
    get length() { return this.data.size; }
    key(index) { return [...this.data.keys()][index] ?? null; }
    getItem(key) { return this.data.get(key) ?? null; }
    setItem(key, value) { this.data.set(key, value); }
    removeItem(key) { this.data.delete(key); }
}
beforeEach(() => { globalThis.localStorage = new MemoryStorage(); });
const set = (id, weight = "10", reps = "5", isCompleted = false) => ({ id, weight, reps, isCompleted });

test("restores checked sets by identity after reorder, preserving saved input values", () => {
    const scope = workoutScope("user-a", "reordered");
    saveWorkoutSets(scope, { exercise: [set("one", "12.5", "8", true), set("two", "20", "6")] });
    assert.deepEqual(restoreWorkoutSets(scope, { exercise: [set("two"), set("one")] }),
        { exercise: [set("two", "20", "6"), set("one", "12.5", "8", true)] });
});
test("removed sets and exercises are discarded and cannot check a new replacement", () => {
    const scope = workoutScope("user-a", "removed");
    saveWorkoutSets(scope, { exercise: [set("removed", "10", "5", true), set("retained")], removedExercise: [set("other")] });
    const current = { exercise: [set("retained"), set("replacement")] };
    const restored = restoreWorkoutSets(scope, current);
    assert.deepEqual(restored, current);
    saveWorkoutSets(scope, restored);
    assert.deepEqual(JSON.parse(localStorage.getItem(`${scope}:sets`)), current);
});
test("both user and draft scope isolate sets and rest timers", () => {
    const scope = workoutScope("user-a", "scoped");
    saveWorkoutSets(scope, { exercise: [set("one", "10", "5", true)] });
    createWebRestTimerStorage(scope).save({ duration: 120000, timeLeft: 45000, endTime: null, isRunning: false });
    for (const other of [workoutScope("user-b", "scoped"), workoutScope("user-a", "different")]) {
        const current = { exercise: [set("one")] };
        assert.deepEqual(restoreWorkoutSets(other, current), current);
        assert.equal(createWebRestTimerStorage(other).load(120000).timeLeft, 120000);
    }
});
test("running rest restoration uses end timestamp instead of stale displayed time", () => {
    const scope = workoutScope("user-a", "running");
    const now = Date.now;
    Date.now = () => 100000;
    try {
        const storage = createWebRestTimerStorage(scope);
        storage.save({ duration: 120000, timeLeft: 90000, endTime: 125000, isRunning: true });
        assert.deepEqual(storage.load(120000), { duration: 120000, timeLeft: 25000, endTime: 125000, isRunning: true });
    } finally { Date.now = now; }
});
test("expired countdown restores at zero and remains stopped on another reload", () => {
    const storage = createWebRestTimerStorage(workoutScope("user-a", "expired"));
    storage.save({ duration: 120000, timeLeft: 90000, endTime: Date.now() - 1000, isRunning: true });
    const restored = storage.load(120000);
    assert.equal(restored.timeLeft, 0);
    assert.equal(restored.isRunning, false);
    assert.equal(restored.endTime, null);
    storage.save(restored);
    assert.deepEqual(storage.load(120000), restored);
});
test("paused rest timer keeps its remaining time", () => {
    const storage = createWebRestTimerStorage(workoutScope("user-a", "paused"));
    const paused = { duration: 120000, timeLeft: 45000, endTime: null, isRunning: false };
    storage.save(paused);
    assert.deepEqual(storage.load(120000), paused);
});
test("completed or abandoned draft clears both snapshots and blocks late saves", () => {
    const scope = workoutScope("user-a", "ended");
    const storage = createWebRestTimerStorage(scope);
    const state = { duration: 120000, timeLeft: 45000, endTime: null, isRunning: false };
    saveWorkoutSets(scope, { exercise: [set("one")] });
    storage.save(state);
    clearDraftSnapshots("ended");
    saveWorkoutSets(scope, { exercise: [set("one")] });
    storage.save(state);
    assert.equal(localStorage.getItem(`${scope}:sets`), null);
    assert.equal(localStorage.getItem(`${scope}:rest`), null);
});
test("logout clears only that user's snapshots", () => {
    for (const user of ["user-a", "user-b"]) saveWorkoutSets(workoutScope(user, "logout"), { exercise: [set("one")] });
    clearUserSnapshots("user-a");
    assert.equal(localStorage.getItem(`${workoutScope("user-a", "logout")}:sets`), null);
    assert.notEqual(localStorage.getItem(`${workoutScope("user-b", "logout")}:sets`), null);
});
test("malformed and unavailable storage safely fall back", () => {
    const scope = workoutScope("user-a", "invalid");
    localStorage.setItem(`${scope}:sets`, '{bad');
    localStorage.setItem(`${scope}:rest`, JSON.stringify({ duration: -1, timeLeft: "bad" }));
    const current = { exercise: [set("one")] };
    assert.deepEqual(restoreWorkoutSets(scope, current), current);
    assert.equal(createWebRestTimerStorage(scope).load(120000).isRunning, false);
    globalThis.localStorage = { getItem() { throw Error("unavailable"); }, setItem() { throw Error("unavailable"); } };
    assert.deepEqual(restoreWorkoutSets(scope, current), current);
    assert.doesNotThrow(() => saveWorkoutSets(scope, current));
    assert.equal(createWebRestTimerStorage(scope).load(120000).timeLeft, 120000);
});
test("hook initializes from persisted state before rendering; native default remains fresh", () => {
    function Probe({ storage }) { return createElement("span", null, JSON.stringify(useRestTimer(120000, storage).state)); }
    const scope = workoutScope("user-a", "initialization");
    const storage = createWebRestTimerStorage(scope);
    const paused = { duration: 120000, timeLeft: 45000, endTime: null, isRunning: false };
    storage.save(paused);
    const markup = renderToString(createElement(Probe, { storage }));
    assert.match(markup, /45000/);
    assert.deepEqual(storage.load(120000), paused);
    assert.match(renderToString(createElement(Probe)), /120000/);
});
test("only fresh workout duration auto-starts, including a pause before the first tick", () => {
    const fresh = createWorkoutTimerInitialState();
    assert.equal(isFreshWorkoutTimer(fresh), true);
    const started = workoutTimerReducer(fresh, { type: "START" });
    const paused = workoutTimerReducer(started, { type: "PAUSE" });
    assert.equal(isFreshWorkoutTimer(started), false);
    assert.equal(isFreshWorkoutTimer({ ...paused, elapsedTime: 0 }), false);
    assert.equal(isFreshWorkoutTimer(paused), false);
    assert.equal(paused.isRunning, false);
});
test("draft API accepts stable IDs and legacy clients, rejecting duplicate identities", () => {
    const exerciseId = "0123456789abcdef01234567";
    const id = "f8f6de5c-e305-4bba-b62b-a5375d3b79b6";
    assert.equal(updateWorkoutDraftSetsSchema.safeParse({ exerciseId, sets: [{ id, weight: "10", reps: "5" }] }).success, true);
    assert.equal(updateWorkoutDraftSetsSchema.safeParse({ exerciseId, sets: [{ weight: "10", reps: "5" }] }).success, true);
    assert.equal(updateWorkoutDraftSetsSchema.safeParse({ exerciseId, sets: [{ id }, { id }] }).success, false);
});

test("backend preserves supplied identities while normalizing weights/reps; legacy callers get IDs", async () => {
    const WorkoutDraft = require("../../backend/src/models/WorkoutDraft.ts").default;
    const { updateWorkoutDraftSets } = require("../../backend/src/services/workoutDraftService.ts");
    const original = WorkoutDraft.findOneAndUpdate;
    let saved;
    WorkoutDraft.findOneAndUpdate = async (_filter, update) => {
        saved = update.$set["exercises.$.sets"];
        return { _id: "0123456789abcdef01234567" };
    };
    try {
        const id = "f8f6de5c-e305-4bba-b62b-a5375d3b79b6";
        await updateWorkoutDraftSets("0123456789abcdef01234567", {
            exerciseId: "0123456789abcdef01234568",
            sets: [{ id, weight: "12.5", reps: "8" }, { weight: "", reps: null }],
        }, "user-a");
        assert.deepEqual(saved[0], { id, weight: 12.5, reps: 8 });
        assert.match(saved[1].id, /^[0-9a-f-]{36}$/);
        assert.equal(saved[1].weight, null);
        assert.equal(saved[1].reps, null);
    } finally { WorkoutDraft.findOneAndUpdate = original; }
});

test("legacy draft identity migration assigns once without replacing sets or existing IDs", async () => {
    const WorkoutDraft = require("../../backend/src/models/WorkoutDraft.ts").default;
    const { getWorkoutDraftById } = require("../../backend/src/services/workoutDraftService.ts");
    const originalFind = WorkoutDraft.findOne;
    const originalUpdate = WorkoutDraft.updateOne;
    const draft = { _id: "0123456789abcdef01234567", exercises: [{
        exerciseId: "0123456789abcdef01234568", sets: [
            { id: "existing-id", weight: 10, reps: 5 }, { weight: 20, reps: 8 },
        ],
    }] };
    let updates = 0;
    WorkoutDraft.findOne = async () => draft;
    WorkoutDraft.updateOne = async (filter, update, options) => {
        updates++;
        assert.equal(filter.userId, "user-a");
        assert.deepEqual(filter["exercises.0.sets.1.id"], { $exists: false });
        assert.deepEqual(Object.keys(update.$set), ["exercises.0.sets.1.id"]);
        assert.equal(options.timestamps, false);
        draft.exercises[0].sets[1].id = update.$set["exercises.0.sets.1.id"];
    };
    try {
        await getWorkoutDraftById(draft._id, "user-a");
        const assigned = draft.exercises[0].sets[1].id;
        await getWorkoutDraftById(draft._id, "user-a");
        assert.equal(updates, 1);
        assert.equal(draft.exercises[0].sets[0].id, "existing-id");
        assert.deepEqual(draft.exercises[0].sets[1], { id: assigned, weight: 20, reps: 8 });
    } finally {
        WorkoutDraft.findOne = originalFind;
        WorkoutDraft.updateOne = originalUpdate;
    }
});

const {
    createWebWorkoutTimerStorage, currentWorkoutReferenceKey,
    readCurrentWorkoutReference, saveCurrentWorkoutReference,
} = require("../src/utils/workoutProgressStorage.ts");
const { restoreSavedWorkout } = require("../src/utils/restoreSavedWorkout.ts");
const persistedDraftId = "0123456789abcdef01234569";

function savedProgress(userId, draftId = persistedDraftId) {
    saveCurrentWorkoutReference(userId, draftId);
    const scope = workoutScope(userId, draftId);
    saveWorkoutSets(scope, { exercise: [set("one", "12.5", "8", true)] });
    createWebRestTimerStorage(scope).save({ duration: 120000, timeLeft: 45000, endTime: null, isRunning: false });
    createWebWorkoutTimerStorage(scope).save({ elapsedTime: 50000, startTime: 1000, lastTickAt: null, isRunning: false });
    return scope;
}

test("browser closure keeps reference, checked sets, and both paused timers in localStorage", async () => {
    const scope = savedProgress("browser-user");
    globalThis.sessionStorage = new MemoryStorage(); // Browser session is gone.
    const result = await restoreSavedWorkout("browser-user", async id => ({ _id: id, userId: "browser-user", status: "active" }));
    assert.deepEqual(result, { status: "ready", draftId: persistedDraftId });
    assert.deepEqual(restoreWorkoutSets(scope, { exercise: [set("one")] }), { exercise: [set("one", "12.5", "8", true)] });
    assert.equal(createWebRestTimerStorage(scope).load(120000).timeLeft, 45000);
    assert.equal(createWebWorkoutTimerStorage(scope).load().elapsedTime, 50000);
    assert.equal(createWebWorkoutTimerStorage(scope).load().isRunning, false);
});

test("workout duration includes time while browser was closed, without double counting on next restore", () => {
    const scope = workoutScope("duration-user", "running-duration");
    const now = Date.now;
    Date.now = () => 100000;
    try {
        const storage = createWebWorkoutTimerStorage(scope);
        storage.save({ elapsedTime: 20000, startTime: 1000, lastTickAt: 60000, isRunning: true });
        const restored = storage.load();
        assert.equal(restored.elapsedTime, 60000);
        assert.equal(restored.lastTickAt, 100000);
        storage.save(restored);
        assert.deepEqual(storage.load(), restored);
    } finally { Date.now = now; }
});

test("duration is isolated by user and draft and ignores the old unscoped timer", () => {
    const scope = savedProgress("duration-owner");
    sessionStorage.setItem("workout-timer-state", JSON.stringify({ elapsedTime: 999999, isRunning: false }));
    assert.equal(createWebWorkoutTimerStorage(scope).load().elapsedTime, 50000);
    for (const other of [workoutScope("another-owner", persistedDraftId), workoutScope("duration-owner", "another-draft"), null]) {
        assert.deepEqual(createWebWorkoutTimerStorage(other).load(), createWorkoutTimerInitialState());
    }
});

for (const status of ["completed", "abandoned", "building"]) {
    test(`backend ${status} draft discards reference and all progress`, async () => {
        const userId = `status-${status}`;
        const scope = savedProgress(userId);
        assert.deepEqual(await restoreSavedWorkout(userId, async id => ({ _id: id, userId, status })), { status: "ready", draftId: null });
        assert.equal(readCurrentWorkoutReference(userId), null);
        for (const kind of ["sets", "duration", "rest"]) assert.equal(localStorage.getItem(`${scope}:${kind}`), null);
    });
}
for (const status of [403, 404, 410]) {
    test(`HTTP ${status} discards inaccessible or deleted draft`, async () => {
        const userId = `http-${status}`;
        const scope = savedProgress(userId);
        await restoreSavedWorkout(userId, async () => { throw Object.assign(new Error("unavailable"), { status }); });
        assert.equal(readCurrentWorkoutReference(userId), null);
        assert.equal(localStorage.getItem(`${scope}:duration`), null);
    });
}

test("a draft owned by another user never restores", async () => {
    const scope = savedProgress("wrong-owner");
    assert.deepEqual(await restoreSavedWorkout("wrong-owner", async id => ({ _id: id, userId: "other-user", status: "active" })), { status: "ready", draftId: null });
    assert.equal(localStorage.getItem(`${scope}:sets`), null);
});

for (const error of [new TypeError("Failed to fetch"), Object.assign(new Error("server"), { status: 503 }), Object.assign(new Error("rate limit"), { status: 429 })]) {
    test(`temporary failure (${error.message}) retains all progress and retry succeeds`, async () => {
        const userId = `retry-${error.message}`;
        savedProgress(userId);
        const before = [...localStorage.data];
        assert.deepEqual(await restoreSavedWorkout(userId, async () => { throw error; }), { status: "unavailable", draftId: null });
        assert.deepEqual([...localStorage.data], before);
        assert.deepEqual(await restoreSavedWorkout(userId, async id => ({ _id: id, userId, status: "active" })), { status: "ready", draftId: persistedDraftId });
    });
}

test("malformed backend response does not destroy valid saved progress", async () => {
    savedProgress("bad-response");
    const before = [...localStorage.data];
    assert.equal((await restoreSavedWorkout("bad-response", async () => ({ status: "unexpected" }))).status, "unavailable");
    assert.deepEqual([...localStorage.data], before);
});

test("malformed references and duration snapshots fail safely", async () => {
    const userId = "corrupt-reference";
    for (const raw of ['{bad', '123', '"not-a-draft"']) {
        localStorage.setItem(currentWorkoutReferenceKey(userId), raw);
        assert.equal(readCurrentWorkoutReference(userId), null);
        assert.equal(localStorage.getItem(currentWorkoutReferenceKey(userId)), null);
    }
    const scope = workoutScope(userId, persistedDraftId);
    for (const raw of ['{bad', 'null', '123', JSON.stringify({ elapsedTime: -1 }), JSON.stringify({ elapsedTime: 5, startTime: null, lastTickAt: null, isRunning: true })]) {
        localStorage.setItem(`${scope}:duration`, raw);
        assert.deepEqual(createWebWorkoutTimerStorage(scope).load(), createWorkoutTimerInitialState());
    }
});

test("completion blocks late duration and reference writes, including another tab's tombstone", () => {
    const scope = savedProgress("late-duration");
    const storage = createWebWorkoutTimerStorage(scope);
    const state = storage.load();
    clearDraftSnapshots(persistedDraftId);
    storage.save(state);
    saveCurrentWorkoutReference("late-duration", persistedDraftId);
    assert.equal(localStorage.getItem(`${scope}:duration`), null);
    assert.equal(readCurrentWorkoutReference("late-duration"), null);
    const otherScope = workoutScope("cross-tab", persistedDraftId);
    localStorage.setItem(`${otherScope}:cleared`, "true");
    createWebWorkoutTimerStorage(otherScope).save(state);
    createWebRestTimerStorage(otherScope).save({ duration: 120000, timeLeft: 50000, endTime: null, isRunning: false });
    saveWorkoutSets(otherScope, { exercise: [set("one")] });
    for (const kind of ["sets", "duration", "rest"]) assert.equal(localStorage.getItem(`${otherScope}:${kind}`), null);
});

test("workout provider hydrates injected scoped storage; the default native initializer stays unchanged", () => {
    // tsx uses the repository's default classic JSX transform for shared source files.
    const priorReact = globalThis.React;
    const priorWindow = globalThis.window;
    globalThis.React = require("react");
    const { WorkoutTimerProvider, useWorkoutTimer } = require("../../../packages/shared/src/timer/workout/WorkoutTimerContext.tsx");
    function Probe() { return createElement("span", null, JSON.stringify(useWorkoutTimer().state)); }
    const scoped = workoutScope("provider-user", "provider-draft");
    const paused = { elapsedTime: 45000, startTime: 1000, lastTickAt: null, isRunning: false };
    const storage = createWebWorkoutTimerStorage(scoped);
    storage.save(paused);
    try {
        assert.match(renderToString(createElement(WorkoutTimerProvider, { storage }, createElement(Probe))), /45000/);
        assert.deepEqual(storage.load(), paused);
        delete globalThis.window;
        assert.match(renderToString(createElement(WorkoutTimerProvider, null, createElement(Probe))), /elapsedTime.*0/);
        globalThis.window = {};
        globalThis.sessionStorage = new MemoryStorage();
        sessionStorage.setItem("workout-timer-state", JSON.stringify(paused));
        assert.match(renderToString(createElement(WorkoutTimerProvider, null, createElement(Probe))), /45000/);
        const noScope = createWebWorkoutTimerStorage(null);
        assert.doesNotMatch(renderToString(createElement(WorkoutTimerProvider, { storage: noScope }, createElement(Probe))), /45000/);
    } finally {
        if (priorReact === undefined) delete globalThis.React; else globalThis.React = priorReact;
        if (priorWindow === undefined) delete globalThis.window; else globalThis.window = priorWindow;
    }
});

test("malformed snapshot keys do not prevent cleanup of valid snapshots", () => {
    localStorage.setItem(`workout-progress:%:${persistedDraftId}:sets`, '{}');
    const scope = savedProgress("cleanup-valid-user");
    assert.doesNotThrow(() => clearDraftSnapshots(persistedDraftId));
    for (const kind of ["sets", "duration", "rest"]) assert.equal(localStorage.getItem(`${scope}:${kind}`), null);
});

test("abandonment clears a reference even if no set or timer snapshot exists", () => {
    const userId = "reference-only";
    saveCurrentWorkoutReference(userId, persistedDraftId);
    clearDraftSnapshots(persistedDraftId);
    assert.equal(readCurrentWorkoutReference(userId), null);
});
