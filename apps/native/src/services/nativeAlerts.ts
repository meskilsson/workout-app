import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AppState, Platform, Vibration } from "react-native";
import { ALERT_FRESHNESS_MS, type TimerEvent } from "@workout-app/shared";
import { NotificationCoordinator, notificationWindow } from "../state/recovery";
import { t } from "../i18n";

type Preferences = {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
};
let revision = 0;
let cueRevision = 0;
let preferences: Preferences = {
  notifications: false,
  sound: true,
  vibration: true,
};
let channelId = "timers";
const coordinator = new NotificationCoordinator({
  cancel: () => Notifications.cancelAllScheduledNotificationsAsync(),
  schedule: (event) => {
    if (event.at <= Date.now()) return Promise.resolve();
    return Notifications.scheduleNotificationAsync({
      identifier: event.id,
      content: {
        title: "Workout App",
        body:
          event.cue === "activity-end"
            ? t("common.completed")
            : event.cue === "work-end"
              ? t("common.rest")
              : t("common.work"),
        sound: preferences.sound ? "default" : false,
        data: { timerEventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(event.at),
        channelId,
      },
    }).then(() => {});
  },
});
let player: ReturnType<typeof createAudioPlayer> | undefined;
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: AppState.currentState !== "active",
    shouldSetBadge: false,
    shouldShowBanner: AppState.currentState !== "active",
    shouldShowList: AppState.currentState !== "active",
  }),
});
export async function foregroundCue(prefs: Preferences, event: TimerEvent) {
  const version = ++cueRevision;
  const current = () =>
    version === cueRevision &&
    AppState.currentState === "active" &&
    Date.now() - event.at <= ALERT_FRESHNESS_MS;
  if (prefs.vibration) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Vibration.vibrate(250);
    }
  }
  if (prefs.sound) {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      if (!current()) return;
      player ??= createAudioPlayer(require("../../assets/timer.wav"));
      await player.seekTo(0);
      if (!current()) return;
      player.play();
    } catch {
      /* Timer progress remains available when audio is unavailable. */
    }
  }
}
export function cancelAlerts() {
  revision++;
  cancelCue();
  return coordinator.cancel().catch(() => {});
}
export function cancelCue() {
  cueRevision++;
  player?.pause();
  Vibration.cancel();
}
export async function prepareNotifications(prefs: Preferences) {
  const id = `timers-${prefs.sound ? "sound" : "silent"}-${prefs.vibration ? "vibrate" : "quiet"}`;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(id, {
      name: t("common.restTimer"),
      importance: Notifications.AndroidImportance.HIGH,
      sound: prefs.sound ? "default" : null,
      enableVibrate: prefs.vibration,
      vibrationPattern: prefs.vibration ? [0, 250] : [0],
    });
  return id;
}
export async function scheduleAlerts(events: TimerEvent[], prefs: Preferences) {
  const version = ++revision;
  try {
    if (
      !prefs.notifications ||
      !(await Notifications.getPermissionsAsync()).granted
    ) {
      if (version === revision) await coordinator.cancel();
      return;
    }
    const id = await prepareNotifications(prefs);
    if (version !== revision) return;
    preferences = prefs;
    channelId = id;
    await coordinator.replace(notificationWindow(events, Date.now()));
  } catch {
    /* System delivery is best effort; the timeline continues to reconcile from timestamps. */
  }
}
