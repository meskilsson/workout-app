import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useRef, useState } from "react";
import {
  type Muscle,
  type WorkoutDraft,
  type WorkoutDraftExercise,
  createWorkoutDraftRequest,
  updateWorkoutDraftExercisesRequest,
  startWorkoutDraftRequest,
  updateWorkoutDraftTrainingRequest, updateWorkoutDraftSetsRequest, completeWorkoutDraftRequest,
} from "../services/workoutDraftApi";
import type { TrainingConfig, CardioCompletion } from "@workout-app/shared";
import TrainingActivity from "../components/TrainingActivity";
import Button from "../components/UI/Button/Button";
import { useAuth } from "../context/AuthContext";
import { type Exercise, exerciseLibraryRequest } from "../services/exerciseApi";

const MUSCLES: Muscle[] = [
  "chest",
  "back",
  "shoulders",
  "triceps",
  "biceps",
  "quads",
  "glutes",
  "hamstrings",
  "calves",
  "core",
  "forearms",
];

export default function StartWorkoutScreen() {
  const { token } = useAuth();
  const actionPending = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  async function perform(action: () => Promise<void>) {
    if (actionPending.current) return;
    actionPending.current = true; setIsSaving(true);
    try { await action(); } catch (error) { Alert.alert("Workout could not be saved", error instanceof Error ? error.message : "Try again"); }
    finally { actionPending.current = false; setIsSaving(false); }
  }
  async function saveActivity(exerciseId: string, training: TrainingConfig, completion?: CardioCompletion) {
    if (!token || !draft) throw new Error("Workout unavailable");
    if (actionPending.current) throw new Error("Wait for the current save to finish");
    actionPending.current = true; setIsSaving(true);
    try { setDraft(await updateWorkoutDraftTrainingRequest(token, draft._id, exerciseId, training, completion)); }
    finally { actionPending.current = false; setIsSaving(false); }
  }
  const [activeCardioId, setActiveCardioId] = useState<string | null>(null);
  const [dirtyConfigs, setDirtyConfigs] = useState<Record<string, boolean>>({});

  const [selectedMuscles, setSelectedMuscles] = useState<Muscle[]>([]);
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  function toggleMuscle(muscle: Muscle) {
    const isAlreadySelected = selectedMuscles.includes(muscle);

    if (!isAlreadySelected) {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }

    if (isAlreadySelected) {
      setSelectedMuscles(
        selectedMuscles.filter((selectedMuscle) => selectedMuscle !== muscle),
      );
    }
  }

  function toggleExerciseId(exerciseId: string) {
    const isAlreadySelected = selectedExerciseIds.includes(exerciseId);

    if (!isAlreadySelected) {
      setSelectedExerciseIds([...selectedExerciseIds, exerciseId]);
    }

    if (isAlreadySelected) {
      setSelectedExerciseIds(
        selectedExerciseIds.filter(
          (selectedExerciseId) => selectedExerciseId !== exerciseId,
        ),
      );
    }
  }

  function addSet(exerciseId: string) {
    if (!draft) {
      Alert.alert("Draft missing", "You need to create a draft first.");
      return;
    }

    const updatedExercises = draft.exercises.map((exercise) => {
      if (exerciseId === exercise.exerciseId) {
        return {
          ...exercise,
          sets: [...exercise.sets, { weight: null, reps: null }],
        };
      } else {
        return exercise;
      }
    });

    setDraft({
      ...draft,
      exercises: updatedExercises,
    });


  }

  async function handleCreateWorkout() {
    if (!token) {
      console.log("No token");
      return;
    }

    const createdDraft = await createWorkoutDraftRequest(
      token,
      selectedMuscles,
    );

    setDraft(createdDraft);

    const exercises = await exerciseLibraryRequest(token, {
      muscles: [],
      limit: 50,
    });

    setAvailableExercises(exercises.exercises);
  }

  async function handleSaveExercises() {
    if (!token) {
      Alert.alert("No token", "You need to be logged in.");
      return;
    }

    if (!draft) {
      return;
    }

    if (selectedExerciseIds.length === 0) {
      Alert.alert("No exercise selected", "Select at least one exercise");
      return;
    }

    const updateDraft = await updateWorkoutDraftExercisesRequest(
      token,
      draft._id,
      selectedExerciseIds,
    );

    setDraft(updateDraft);
  }

  async function handleStartWorkout() {
    if (!token) {
      Alert.alert("No token", "You need to be logged in.");
      return;
    }

    if (!draft) {
      Alert.alert("Draft missing", "You need to create a draft first.");
      return;
    }

    if (!draft.exercises || draft.exercises.length === 0) {
      Alert.alert(
        "No exercises",
        "Add at least one exercise to start the workout.",
      );
      return;
    }

    const startDraft = await startWorkoutDraftRequest(token, draft._id);

    setDraft(startDraft);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!draft && (
        <View>
          <Text style={styles.title}>Start your workout</Text>

          <Text style={styles.description}>
            Choose the muscle groups you want to train.
          </Text>

          <Text>Selected: {selectedMuscles.length}. Leave empty for cardio or all activities.</Text>

          <View style={styles.muscleGrid}>
            {MUSCLES.map((muscle) => {
              const isSelected = selectedMuscles.includes(muscle);
              return (
                <Pressable
                  key={muscle}
                  style={[
                    styles.muscleButton,
                    isSelected && styles.muscleButtonSelected,
                  ]}
                  onPress={() => toggleMuscle(muscle)}
                >
                  <Text style={styles.muscleButtonText}>{muscle}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            onPress={() => perform(handleCreateWorkout)}
            disabled={isSaving || !token}
          >
            Create Workout
          </Button>
        </View>
      )}

      {draft && draft.status === "building" && (
        <View>
          <Text>Status: {draft.status}</Text>
          <Text>Muscles: {draft.selectedMuscleGroups.join(", ")}</Text>
          <Text>Exercises: {draft.exercises.length}</Text>
          <Text>Available exercises {availableExercises.length}</Text>
          {availableExercises.length > 0 && (
            <View>
              <Text>Selected exercises: {selectedExerciseIds.length}</Text>
              {availableExercises.map((exercise) => {
                const isSelected = selectedExerciseIds.includes(exercise._id);

                return (
                  <Pressable
                    key={exercise._id}
                    onPress={() => toggleExerciseId(exercise._id)}
                    style={[
                      styles.exerciseButton,
                      isSelected && styles.exerciseButtonSelected,
                    ]}
                  >
                    <Text>{exercise.name}</Text>
                  </Pressable>
                );
              })}
              <Button
                onPress={() => perform(handleSaveExercises)}
                disabled={isSaving || selectedExerciseIds.length === 0 || !token}
              >
                Save Exercises
              </Button>

              {draft.exercises.map(exercise => <View key={exercise.exerciseId}><Text>{exercise.exerciseName}</Text><TrainingActivity initial={exercise.training} building activeId={null} exerciseId={exercise.exerciseId} onStart={() => {}} onDirty={dirty => setDirtyConfigs(prev => ({ ...prev, [exercise.exerciseId]: dirty }))} onSave={(training, completion) => saveActivity(exercise.exerciseId, training, completion)} /></View>)}
              <Button
                onPress={() => perform(handleStartWorkout)}
                disabled={isSaving || draft.exercises.length === 0 || !token || Object.values(dirtyConfigs).some(Boolean)}
              >
                Start Workout
              </Button>
            </View>
          )}
        </View>
      )}

      {draft && draft.status === "active" && (
        <View>
          <Text style={styles.title}>Active Workout</Text>
          <Text>Exercises: {draft.exercises.length}</Text>
          {draft.exercises.map((exercise) => (
            <View key={exercise.exerciseId}>
              <Text>{exercise.exerciseName}</Text>
              {exercise.training && exercise.training.format !== "strength" ? <TrainingActivity initial={exercise.training} building={false} activeId={activeCardioId} exerciseId={exercise.exerciseId} onStart={() => setActiveCardioId(exercise.exerciseId)} onDirty={() => {}} onSave={(training, completion) => saveActivity(exercise.exerciseId, training, completion)} /> : <><Text>Sets: {exercise.sets.length}</Text>{exercise.sets.map((set, index) => <View key={index}><Text>Set {index + 1}</Text>{(["weight", "reps"] as const).map(field => <TextInput key={field} accessibilityLabel={`${field} for set ${index + 1}`} placeholder={field} keyboardType="numeric" value={set[field] === null ? "" : String(set[field])} onChangeText={value => setDraft(prev => prev ? { ...prev, exercises: prev.exercises.map(e => e.exerciseId === exercise.exerciseId ? { ...e, sets: e.sets.map((s, i) => i === index ? { ...s, [field]: value === "" ? null : Number(value) } : s) } : e) } : prev)} />)}</View>)}</>}
              {(!exercise.training || exercise.training.format === "strength") && <Button onPress={() => { setActiveCardioId(null); addSet(exercise.exerciseId); }}>Add set</Button>}
            </View>
          ))}
          <Button disabled={isSaving} onPress={() => perform(async () => {
            if (!token) return;
            try { for (const e of draft.exercises) { if (!e.training || e.training.format === "strength") await updateWorkoutDraftSetsRequest(token, draft._id, e.exerciseId, e.sets); }
              await completeWorkoutDraftRequest(token, draft._id); setActiveCardioId(null); setDraft(null); setSelectedExerciseIds([]); Alert.alert("Workout saved");
            } catch (e) { Alert.alert("Could not complete workout", e instanceof Error ? e.message : "Try again"); }
          })}>Finish workout</Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    marginTop: 12,
  },

  muscleButton: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 3,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  muscleButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  muscleButtonSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  exerciseButton: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 3,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  exerciseButtonSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
});
