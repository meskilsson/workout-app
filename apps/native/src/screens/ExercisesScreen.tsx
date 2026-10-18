import { useFocusEffect } from "@react-navigation/native";
import MusclePreview from "../components/MusclePreview";
import { useCallback, useState } from "react";
import { BackHandler, Image, Linking } from "react-native";
import {
  MUSCLE_OPTIONS,
  EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  type Exercise,
} from "@workout-app/shared";
import { Page, Card, Txt, Form, Action, Row, confirm } from "../components/ui";
import ExerciseBrowser from "../components/ExerciseBrowser";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/apiClient";
import { exerciseName } from "../i18n";
import { usePreferences } from "../context/PreferencesContext";

export default function ExercisesScreen() {
  const { token, user } = useAuth();
  const prefs = usePreferences();
  const [mine, setMine] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null),
    [editing, setEditing] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (editing) {
            setEditing(false);
            return true;
          }
          if (exercise) {
            setExercise(null);
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [editing, exercise]),
  );
  if (editing)
    return (
      <Page>
        <Txt title>{exercise ? "Edit exercise" : "Create exercise"}</Txt>
        <ExerciseEditor
          initial={exercise}
          onCancel={() => setEditing(false)}
          onSave={async (values) => {
            const saved = await apiFetch<Exercise>(
              `/api/exercises${exercise ? `/${exercise._id}` : ""}`,
              {
                token,
                method: exercise ? "PATCH" : "POST",
                body: JSON.stringify(values),
              },
            );
            setExercise(saved);
            setEditing(false);
            setRevision(revision + 1);
          }}
        />
      </Page>
    );
  if (exercise) {
    const translated =
      prefs.language === "sv" && !exercise.isCustom
        ? exercise.translations?.sv
        : undefined;
    return (
      <Page>
        <Action onPress={() => setExercise(null)}>Back</Action>
        <Card>
          <Txt title literal>
            {exerciseName(exercise)}
          </Txt>
          {exercise.imageUrl && /^https?:\/\//i.test(exercise.imageUrl) ? (
            <Image
              source={{ uri: exercise.imageUrl }}
              style={{ width: "100%", height: 220, borderRadius: 16 }}
              resizeMode="contain"
              accessibilityLabel={exerciseName(exercise)}
            />
          ) : null}
          <Txt literal>
            {translated?.description ?? exercise.description ?? ""}
          </Txt>
          <Txt literal>
            {translated?.instructions ?? exercise.instructions ?? ""}
          </Txt>
          <MusclePreview
            primary={exercise.primaryMuscles}
            secondary={exercise.secondaryMuscles}
          />
          <Txt>Primary muscles</Txt>
          <Row>
            {exercise.primaryMuscles?.map((m) => (
              <Txt key={m}>{m}</Txt>
            ))}
          </Row>
          <Txt>Secondary muscles</Txt>
          <Row>
            {exercise.secondaryMuscles?.map((m) => (
              <Txt key={m}>{m}</Txt>
            ))}
          </Row>
          <Txt>
            {[exercise.exerciseType, exercise.equipment, exercise.difficulty]
              .filter(Boolean)
              .join(" · ")}
          </Txt>
          {exercise.videoUrl && /^https?:\/\//i.test(exercise.videoUrl) ? (
            <Action onPress={() => void Linking.openURL(exercise.videoUrl!)}>
              Watch video
            </Action>
          ) : null}
        </Card>
        {exercise.isCustom && exercise.createdBy === user?._id && (
          <Row>
            <Action onPress={() => setEditing(true)}>Edit</Action>
            <Action
              onPress={() =>
                confirm("Delete exercise", () => {
                  void apiFetch(`/api/exercises/${exercise._id}`, {
                    token,
                    method: "DELETE",
                  })
                    .then(() => {
                      setExercise(null);
                      setRevision(revision + 1);
                    })
                    .catch((e) => setError(e.message));
                })
              }
            >
              Delete exercise
            </Action>
          </Row>
        )}
        {error ? <Txt error>{error}</Txt> : null}
      </Page>
    );
  }
  return (
    <Page>
      <Txt title>Exercise library</Txt>
      {token && (
        <Row>
          <Action selected={!mine} onPress={() => setMine(false)}>
            All exercises
          </Action>
          <Action selected={mine} onPress={() => setMine(true)}>
            My exercises
          </Action>
        </Row>
      )}
      {token && (
        <Action onPress={() => setEditing(true)}>Create exercise</Action>
      )}
      <ExerciseBrowser
        key={`${revision}:${mine}`}
        scope={mine ? "personal-exercises" : "library"}
        personalOnly={mine}
        publicOnly={!token}
        onChoose={setExercise}
      />
    </Page>
  );
}
export function ExerciseEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Exercise | null;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState(initial?.exerciseType ?? "strength"),
    [equipment, setEquipment] = useState(initial?.equipment ?? ""),
    [difficulty, setDifficulty] = useState(initial?.difficulty ?? ""),
    [primary, setPrimary] = useState(initial?.primaryMuscles ?? []),
    [secondary, setSecondary] = useState(initial?.secondaryMuscles ?? []);
  const options = (
    title: string,
    values: readonly string[],
    selected: string,
    change: (v: string) => void,
  ) => (
    <>
      <Txt>{title}</Txt>
      <Row>
        {values.map((v) => (
          <Action key={v} selected={v === selected} onPress={() => change(v)}>
            {v}
          </Action>
        ))}
      </Row>
    </>
  );
  return (
    <Card>
      {options("Training type", EXERCISE_TYPE_OPTIONS, type, (value) =>
        setType(value as typeof type),
      )}
      {options("Equipment", EQUIPMENT_OPTIONS, equipment, setEquipment)}
      {options("Difficulty", DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
      {(["Primary muscles", "Secondary muscles"] as const).map(
        (title, index) => (
          <Row key={title}>
            <Txt>{title}</Txt>
            {MUSCLE_OPTIONS.map((m) => {
              const selected = index ? secondary : primary;
              return (
                <Action
                  key={m}
                  selected={selected.includes(m)}
                  onPress={() => {
                    const next = selected.includes(m)
                      ? selected.filter((v) => v !== m)
                      : [...selected, m];
                    if (index) setSecondary(next);
                    else setPrimary(next);
                  }}
                >
                  {m}
                </Action>
              );
            })}
          </Row>
        ),
      )}
      <Form
        fields={[
          {
            name: "name",
            title: "Name",
            value: initial?.name,
            required: true,
            min: 2,
            max: 50,
          },
          {
            name: "description",
            title: "Description",
            value: initial?.description,
            multiline: true,
          },
          {
            name: "instructions",
            title: "Instructions",
            value: initial?.instructions,
            multiline: true,
          },
          { name: "videoUrl", title: "Video URL", value: initial?.videoUrl },
          { name: "imageUrl", title: "Image URL", value: initial?.imageUrl },
        ]}
        submit={(values) =>
          onSave({
            ...values,
            exerciseType: type,
            ...(equipment ? { equipment } : {}),
            ...(difficulty ? { difficulty } : {}),
            primaryMuscles: primary,
            secondaryMuscles: secondary,
          })
        }
        onCancel={onCancel}
      />
    </Card>
  );
}
