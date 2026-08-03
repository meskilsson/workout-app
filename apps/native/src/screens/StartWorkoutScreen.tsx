import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useState } from "react";
import {
  type Muscle,
  type WorkoutDraft,
  type WorkoutDraftExercise,
  createWorkoutDraftRequest,
  updateWorkoutDraftExercisesRequest,
  startWorkoutDraftRequest,
} from "../services/workoutDraftApi";
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
      muscles: createdDraft.selectedMuscleGroups,
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

          <Text>Selected: {selectedMuscles.length}</Text>

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
            onPress={handleCreateWorkout}
            disabled={selectedMuscles.length === 0 || !token}
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
                onPress={handleSaveExercises}
                disabled={selectedExerciseIds.length === 0 || !token}
              >
                Save Exercises
              </Button>

              <Button
                onPress={handleStartWorkout}
                disabled={draft.exercises.length === 0 || !token}
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
              <Text>Sets: {exercise.sets.length}</Text>
              <Button
              onPress={() => addSet(exercise.exerciseId)}
              >Add set</Button>
            </View>
          ))}
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
