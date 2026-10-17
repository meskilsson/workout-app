import { readRestDuration } from "../../utils/restTimerPreference";
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { RestTimerStateProvider } from "@workout-app/shared/timer/rest";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { cancelTimerAudio, playTimerCue, prepareRestAlertAudio, refreshRestAlertPreference, restAlertsEnabled } from "../../utils/restTimerAlerts";
import { WORKOUT_SNAPSHOT_CLEARED, workoutScope } from "../../utils/workoutProgressStorage";
import { WebTimerStore } from "../../utils/webTimerStore";
import { claimTimerEvent, recordTimerAuthority } from "../../utils/timerClaims";
import { ALERT_FRESHNESS_MS } from "../../utils/timerTimeline";
import { dismissTimerNotifications, pushPreference, registerTimerWorker, savePushPreference, setTimerPushFailed, syncTimerPush, timerDeviceId, timerPushRequest } from "../../services/timerPush";
import { WebTimerContext } from "./WebTimerContext";
import { locale } from "../../i18n";
import { useWorkoutWakeLock } from "../../hooks/useWorkoutWakeLock";

function createStore(scope: string | null, userId: string | undefined, currentWorkoutId: string | null) {
        const owner = new WebTimerStore(scope, readRestDuration(userId), Date.now, async (event, revision) => {
            // A hidden page leaves delivery to Web Push. Never replay historical cues.
            if (document.visibilityState !== "visible" || !restAlertsEnabled()) return;
            if (!await claimTimerEvent(event.id) || document.visibilityState !== "visible" || !owner.isCurrent(revision) || Date.now() - event.at > ALERT_FRESHNESS_MS) return;
            if (userId && pushPreference(userId)) void timerPushRequest("/ack", { deviceId: timerDeviceId(), draftId: currentWorkoutId, eventId: event.id }).catch(() => {});
            playTimerCue(event.cue);
            window.dispatchEvent(new Event(event.exerciseId ? "cardio-timer-completed" : "rest-timer-completed"));
        });
        return owner;
}

export default function WebRestTimerProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentWorkoutId, setCurrentWorkoutId } = useCurrentWorkout();
    const scope = user && currentWorkoutId ? workoutScope(user._id, currentWorkoutId) : null;
    useWorkoutWakeLock(scope);
    const userId = user?._id;
    const store = useMemo(() => createStore(scope, userId, currentWorkoutId), [scope, userId, currentWorkoutId]);
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
    const controls = useMemo(() => ({
        start: () => { prepareRestAlertAudio(); cancelTimerAudio(); void store.restAction({ type: "START" }); },
        pause: () => { cancelTimerAudio(); void store.restAction({ type: "PAUSE" }); },
        reset: () => { cancelTimerAudio(); void store.restAction({ type: "RESET" }); },
        setDuration: (durationMs: number) => { cancelTimerAudio(); void store.restAction({ type: "SET_DURATION", durationMs }); },
        adjustTime: (amountMs: number) => { cancelTimerAudio(); void store.restAction({ type: "ADJUST_TIME", amountMs }); },
    }), [store]);
    const timer = useMemo(() => ({ ...controls, state: snapshot.rest }), [controls, snapshot.rest]);
    useEffect(() => {
        if (!scope || !user || !currentWorkoutId) return;
        let sentRevision = -1;
        let pendingSync: number | undefined;
        const sync = (force?: Event) => {
            if (!pushPreference(user._id)) return;
            window.clearTimeout(pendingSync);
            // Collapse reset+start into one schedule. New revisions must never
            // wait behind a slow obsolete network request; the server rejects it.
            pendingSync = window.setTimeout(() => {
                const value = store.getSnapshot();
                if ((!force && sentRevision === value.revision) || !store.isCurrent(value.revision)) return;
                sentRevision = value.revision;
                const events = restAlertsEnabled() ? store.events().filter(event => event.at > Date.now()) : [];
                void syncTimerPush(currentWorkoutId, value.revision, events, locale()).then(() => {
                    if (store.isCurrent(value.revision)) setTimerPushFailed(false);
                }).catch(() => {
                    if (!store.isCurrent(value.revision)) return;
                    sentRevision = -1; setTimerPushFailed(true); window.dispatchEvent(new Event("timer-push-unavailable"));
                });
            }, 50);
        };
        const unsubscribe = store.subscribe(sync);
        const retry = window.setInterval(sync, 15000);
        window.addEventListener("online", sync);
        const changedPreference = () => { void store.refreshSchedule(); };
        window.addEventListener("timer-push-preference", changedPreference);
        window.addEventListener("timer-alert-preference", changedPreference);
        sync();
        return () => { window.clearTimeout(pendingSync); window.clearInterval(retry); unsubscribe(); window.removeEventListener("online", sync); window.removeEventListener("timer-push-preference", changedPreference); window.removeEventListener("timer-alert-preference", changedPreference); };
    }, [store, scope, currentWorkoutId, user]);
    useEffect(() => {
        store.activate();
        setTimerPushFailed(false);
        let recordedRevision = -1;
        const record = () => {
            const revision = store.getSnapshot().revision;
            if (!scope || revision === recordedRevision) return;
            recordedRevision = revision;
            void recordTimerAuthority(scope, revision, true);
            void dismissTimerNotifications(store.events().map(event => event.id));
        };
        const unsubscribe = store.subscribe(record);
        record();
        const invalidate = () => {
            store.stop(); cancelTimerAudio();
            if (scope) void recordTimerAuthority(scope, Math.max(Date.now() * 1000, store.getSnapshot().revision + 1), false);
            void dismissTimerNotifications();
        };
        const tick = () => store.reconcile();
        const visibility = () => { if (document.visibilityState !== "visible") cancelTimerAudio(); tick(); };
        const id = window.setInterval(tick, 250);
        const onCleared = (event: Event) => {
            if (scope && (event as CustomEvent<string>).detail === scope) { invalidate(); setCurrentWorkoutId(null); }
        };
        const onUserCleared = (event: Event) => {
            if (userId && (event as CustomEvent<string>).detail === userId) { savePushPreference(userId, false); invalidate(); }
        };
        const onStorage = (event: StorageEvent) => {
            if (scope && event.key === `${scope}:cleared` && event.newValue === "true") { invalidate(); setCurrentWorkoutId(null); }
            else if ((event.key === `${scope}:web-timers` && event.newValue === null) || (event.key === "workout-auth-session" && event.newValue === null)) { invalidate(); setCurrentWorkoutId(null); }
            else if (event.key === `${scope}:web-timers`) { cancelTimerAudio(); tick(); }
            else if (event.key === "rest-timer-alerts") { refreshRestAlertPreference(); cancelTimerAudio(); void store.refreshSchedule(); }
        };
        document.addEventListener("pointerdown", prepareRestAlertAudio, true);
        document.addEventListener("keydown", prepareRestAlertAudio, true);
        document.addEventListener("visibilitychange", visibility);
        window.addEventListener("focus", tick);
        window.addEventListener("pageshow", tick);
        window.addEventListener(WORKOUT_SNAPSHOT_CLEARED, onCleared);
        window.addEventListener("storage", onStorage);
        window.addEventListener("workout-user-cleared", onUserCleared);
        if ("serviceWorker" in navigator && window.isSecureContext) void registerTimerWorker().catch(() => {});
        return () => {
            store.stop(); cancelTimerAudio(); window.clearInterval(id);
            unsubscribe(); window.removeEventListener("workout-user-cleared", onUserCleared);
            document.removeEventListener("pointerdown", prepareRestAlertAudio, true);
            document.removeEventListener("keydown", prepareRestAlertAudio, true);
            document.removeEventListener("visibilitychange", visibility);
            window.removeEventListener("focus", tick); window.removeEventListener("pageshow", tick);
            window.removeEventListener(WORKOUT_SNAPSHOT_CLEARED, onCleared); window.removeEventListener("storage", onStorage);
        };
    }, [scope, setCurrentWorkoutId, store, userId]);
    return <WebTimerContext.Provider value={store}><RestTimerStateProvider value={timer}>{children}</RestTimerStateProvider></WebTimerContext.Provider>;
}
