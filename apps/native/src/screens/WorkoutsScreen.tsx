import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { WorkoutSession } from "@workout-app/shared";
import { Page, Card, Txt, Action, Busy } from "../components/ui";
import { useWorkout } from "../context/WorkoutContext";
import { locale, t } from "../i18n";

export default function WorkoutsScreen({ navigation }: { navigation: any }) {
  const w = useWorkout();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  function load() {
    setLoading(true);
    setError("");
    void w
      .request<WorkoutSession[]>("/api/workout-sessions/me")
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );
  return (
    <Page>
      <Txt title>Workout history</Txt>
      <Action onPress={() => navigation.navigate("Templates")}>
        Workout templates
      </Action>
      {loading ? (
        <Busy />
      ) : error ? (
        <>
          <Txt error>{error}</Txt>
          <Action onPress={load}>Try again</Action>
        </>
      ) : sessions.length === 0 ? (
        <Txt>No workouts yet</Txt>
      ) : (
        <>
          <Card>
            <Txt>{`${sessions.length} ${t("common.workouts")} · ${sessions.reduce((sum, s) => sum + s.exercises.reduce((n, e) => n + e.sets.length, 0), 0)} ${t("common.totalSets")}`}</Txt>
          </Card>
          {sessions.map((session) => (
            <Card key={session._id}>
              <Action
                onPress={() =>
                  navigation.navigate("Session", { sessionId: session._id })
                }
              >
                {new Date(session.endedAt).toLocaleString(locale())}
              </Action>
              <Txt>
                {session.exercises.map((e) => e.exerciseName).join(" · ")}
              </Txt>
              <Txt>{`${session.exercises.length} ${t("common.exercises")} · ${session.exercises.reduce((sum, e) => sum + e.sets.length, 0)} ${t("common.totalSets")}`}</Txt>
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
