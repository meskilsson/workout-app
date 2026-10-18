import { useEffect, useState } from "react";
import {
  formatTrainingSeconds,
  trainingTotalSeconds,
  type WorkoutSession,
} from "@workout-app/shared";
import { Page, Card, Txt, Action, Busy, confirm } from "../components/ui";
import { useWorkout } from "../context/WorkoutContext";
import type { WorkoutDraft } from "../services/workoutDraftApi";
import { locale, number, t } from "../i18n";

export default function SessionScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const w = useWorkout();
  const [session, setSession] = useState<WorkoutSession | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    void w
      .request<WorkoutSession>(
        `/api/workout-sessions/${route.params.sessionId}`,
      )
      .then((s) => {
        if (alive) setSession(s);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [route.params.sessionId, attempt]);
  async function repeat() {
    const draft = await w.request<WorkoutDraft>(
      `/api/workout-sessions/${session!._id}/repeat`,
      "POST",
    );
    w.adopt(draft);
    await w.mutate("/start");
    navigation.navigate("MainTabs", { screen: "Train" });
  }
  return (
    <Page>
      <Txt title>Workout summary</Txt>
      {error ? (
        <>
          <Txt error>{error}</Txt>
          <Action
            onPress={() => {
              setError("");
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </Action>
        </>
      ) : !session ? (
        <Busy />
      ) : (
        <>
          <Card>
            <Txt>{new Date(session.endedAt).toLocaleString(locale())}</Txt>
            <Txt>{`${session.exercises.length} ${t("common.exercises")} · ${session.exercises.reduce((sum, e) => sum + e.sets.length, 0)} ${t("common.totalSets")}`}</Txt>
            {session.startedAt && (
              <Txt>
                {formatTrainingSeconds(
                  (Date.parse(session.endedAt) -
                    Date.parse(session.startedAt)) /
                    1000,
                )}
              </Txt>
            )}
          </Card>
          {session.exercises.map((e, i) => (
            <Card key={i}>
              <Txt title literal>
                {e.exerciseName}
              </Txt>
              {e.supersetId && <Txt>Superset</Txt>}
              {e.training && e.training.format !== "strength" ? (
                <Txt>{`${t("common.planned")} ${formatTrainingSeconds(trainingTotalSeconds(e.training))} · ${t("common.actual")} ${formatTrainingSeconds(e.cardioCompletion?.elapsedSeconds ?? 0)} · ${e.cardioCompletion?.completedRounds ?? 0} ${t("common.rounds")}${e.cardioCompletion?.manual ? ` · ${t("common.completedManually")}` : ""}`}</Txt>
              ) : (
                e.sets.map((set, index) => (
                  <Txt
                    key={index}
                  >{`${index + 1}: ${number(set.weight)} kg × ${number(set.reps)}`}</Txt>
                ))
              )}
            </Card>
          ))}
          {w.error && <Txt error>{w.error}</Txt>}
          <Action
            disabled={w.busy}
            onPress={() =>
              w.draft
                ? confirm("Replace current workout?", () => void w.run(repeat))
                : void w.run(repeat)
            }
          >
            Repeat workout
          </Action>
          <Action
            disabled={w.busy}
            onPress={() =>
              confirm(
                "Delete workout",
                () =>
                  void w.run(async () => {
                    await w.request(
                      `/api/workout-sessions/${session._id}`,
                      "DELETE",
                    );
                    navigation.goBack();
                  }),
              )
            }
          >
            Delete workout
          </Action>
        </>
      )}
    </Page>
  );
}
