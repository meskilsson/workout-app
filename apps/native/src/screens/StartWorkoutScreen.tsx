import { Alert, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import Button from "../components/UI/Button/Button";
import { useAuth } from "../context/AuthContext";
import { exerciseLibraryRequest, type Exercise } from "../services/exerciseApi";
import {
    createWorkoutDraftRequest,
    getCurrentWorkoutDraftRequest,
    updateWorkoutDraftExercisesRequest,
    startWorkoutDraftRequest,
    type Muscle,
    type WorkoutDraft,
} from "../services/workoutDraftApi";

import { useState } from "react";


const MUSCLE_OPTIONS: Muscle[] = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
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

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    function toggleMuscle(muscle: Muscle) {
        setSelectedMuscles((currentMuscles) => {
            const isAlreadySelected = currentMuscles.includes(muscle);

            if (isAlreadySelected) {
                return currentMuscles.filter((currentMuscles) => currentMuscles !== muscle);
            }

            return [...currentMuscles, muscle];
        });
    }

    function toggleExercise(exerciseId: string) {
        setSelectedExerciseIds((currentExerciseIds) => {
            const isAlreadySelected = currentExerciseIds.includes(exerciseId);

            if (isAlreadySelected) {
                return currentExerciseIds.filter(
                    (currentExerciseIds) => currentExerciseIds !== exerciseId,
                );
            }

            return [...currentExerciseIds, exerciseId];
        });
    }

    async function loadExercisesForMuscles(muscles: Muscle[]) {
        if (!token) {
            return;
        }

        const result = await exerciseLibraryRequest(token, {
            muscles,
            limit: 50,
        });

        setAvailableExercises(result.exercises);
    }



    async function handleCreateDraft() {
        try {
            if (!token) {
                Alert.alert("Not logged in", "You need to log in first.");
                return;
            }

            if (selectedMuscles.length === 0) {
                Alert.alert("Choose muscles", "Select at least one muscle group.");
                return;
            }

            setIsLoading(true);
            setMessage("Creating workout draft...");

            const createdDraft = await createWorkoutDraftRequest(
                token,
                selectedMuscles,
            );

            setDraft(createdDraft);

            setSelectedExerciseIds([]);
            await loadExercisesForMuscles(createdDraft.selectedMuscleGroups);
            setMessage("Workout draft created.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to create workout draft.");
            Alert.alert("Error", "Could not create workout draft.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLoadCurrentDraft() {
        try {
            if (!token) {
                Alert.alert("Not logged in", "You need to log in first.");
                return;
            }

            setIsLoading(true);
            setMessage("Loading current workout draft...");

            const currentDraft = await getCurrentWorkoutDraftRequest(token);

            setDraft(currentDraft);

            if (currentDraft) {
                setSelectedMuscles(currentDraft.selectedMuscleGroups);

                setSelectedExerciseIds(
                    currentDraft.exercises.map((exercise) => exercise.exerciseId),
                );

                await loadExercisesForMuscles(currentDraft.selectedMuscleGroups);

                setMessage("Current draft loaded.");
            } else {
                setSelectedExerciseIds([]);
                setAvailableExercises([]);
                setMessage("No current draft.");
            }
        } catch (error) {
            console.log(error);
            setMessage("Failed to load current draft.");
            Alert.alert("Error", "Could not load current draft.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSaveExercises() {
        try {
            if (!token) {
                Alert.alert("Not logged in", "You need to log in first.");
                return;
            }

            if (!draft) {
                Alert.alert("No draft", "Create a workout draft first.");
                return;
            }

            if (draft.status !== "building") {
                Alert.alert(
                    "Workout already started",
                    "This exercise picker is only for building a workout before it starts.",
                );
                return;
            }

            if (selectedExerciseIds.length === 0) {
                Alert.alert("Choose exercises", "Select at least one exercise.");
                return;
            }

            setIsLoading(true);
            setMessage("Saving exercises...");

            const updatedDraft = await updateWorkoutDraftExercisesRequest(
                token,
                draft._id,
                selectedExerciseIds,
            );

            setDraft(updatedDraft);

            setSelectedExerciseIds(
                updatedDraft.exercises.map((exercise) => exercise.exerciseId),
            );

            setMessage("Exercises saved to draft.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to save exercises.");
            Alert.alert("Error", "Could not save exercises to the draft.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleStartWorkout() {
        try {
            if (!token) {
                Alert.alert("Not logged in.", "You need to log in first.");
                return;
            }

            if (!draft) {
                Alert.alert("No draft", "Create a workout draft first.");
                return;
            }

            if (draft.status !== "building") {
                Alert.alert(
                    "Workout already started",
                    "This workout has already been started.",
                );
                return;
            }

            if (draft.exercises.length === 0) {
                Alert.alert(
                    "No exercises",
                    "Add at least one exercise before starting the workout.",
                );
                return;
            }

            setIsLoading(true);
            setMessage("Starting workout...");

            const startedDraft = await startWorkoutDraftRequest(token, draft._id);

            setDraft(startedDraft);
            setMessage("Workout started.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to start workout.");
            Alert.alert("Error", "Could not start the workout.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
        >
            <Text style={styles.kicker}>Train</Text>
            <Text style={styles.title}>Start a workout</Text>

            <Text style={styles.description}>
                Choose which muscle groups you want to train. This creates a workout
                draft that we can later add exercises to.
            </Text>

            <View style={styles.muscleGrid}>
                {MUSCLE_OPTIONS.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle);

                    return (
                        <Pressable
                            key={muscle}
                            onPress={() => toggleMuscle(muscle)}
                            style={[
                                styles.muscleButton,
                                isSelected && styles.muscleButtonSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.muscleButtonText,
                                    isSelected && styles.muscleButtonTextSelected,
                                ]}
                            >
                                {muscle}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.actions}>
                <Button
                    variant="primary"
                    onPress={handleCreateDraft}
                    disabled={isLoading}
                >{isLoading ? "Working..." : "Create workout draft"}
                </Button>

                <Button
                    variant="primary"
                    onPress={handleLoadCurrentDraft}
                    disabled={isLoading}
                >
                    Load current draft
                </Button>
            </View>

            {message && <Text style={styles.message}>{message}</Text>}

            {draft && draft.status === "building" && availableExercises.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose exercises</Text>

                    <Text style={styles.description}>
                        Select the exercises you want in this workout.
                    </Text>

                    <View style={styles.exerciseList}>
                        {availableExercises.map((exercise) => {
                            const isSelected = selectedExerciseIds.includes(exercise._id);

                            return (
                                <Pressable
                                    key={exercise._id}
                                    onPress={() => toggleExercise(exercise._id)}
                                    style={[
                                        styles.exerciseCard,
                                        isSelected && styles.exerciseCardSelected,
                                    ]}
                                >
                                    <View style={styles.exerciseHeader}>
                                        <Text
                                            style={[
                                                styles.exerciseName,
                                                isSelected && styles.exerciseNameSelected,
                                            ]}
                                        >
                                            {exercise.name}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.selectBadge,
                                                isSelected && styles.selectBadgeSelected,
                                            ]}
                                        >
                                            {isSelected ? "Selected" : "Tap to add"}
                                        </Text>
                                    </View>

                                    <Text style={styles.exerciseMeta}>
                                        {exercise.primaryMuscles?.join(", ") || "No primary muscles"}
                                    </Text>

                                    {exercise.equipment && (
                                        <Text style={styles.exerciseMeta}>
                                            Equipment: {exercise.equipment}
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    <Button
                        variant="primary"
                        onPress={handleSaveExercises}
                        disabled={isLoading}
                    >
                        Save selected exercises
                    </Button>
                </View>
            )}

            {draft && draft.status === "building" && draft.exercises.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ready?</Text>

                    <Text style={styles.description}>
                        You have selected {draft.exercises.length} exercises. Start the workout
                        when you are ready to begin tracking sets.
                    </Text>

                    <Button
                        variant="primary"
                        onPress={handleStartWorkout}
                        disabled={isLoading}
                    >
                        Start workout
                    </Button>
                </View>
            )}

            {draft && (
                <View style={styles.draftCard}>
                    <Text style={styles.cardTitle}>
                        {draft.status === "active" ? "Active workout" : "Current draft"}
                    </Text>

                    <Text>Status: {draft.status}</Text>
                    <Text>Purpose: {draft.purpose}</Text>
                    <Text>Muscles: {draft.selectedMuscleGroups.join(", ")}</Text>
                    <Text>Exercises: {draft.exercises.length}</Text>

                    {draft.startedAt && <Text>Started: {draft.startedAt}</Text>}

                    <Text numberOfLines={1}>Draft ID: {draft._id}</Text>
                </View>
            )}
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        gap: 16,
        backgroundColor: "#f3f4f6",
    },
    kicker: {
        fontSize: 14,
        fontWeight: "800",
        color: "#2563eb",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
    },
    description: {
        fontSize: 16,
        lineHeight: 22,
        color: "#4b5563",
    },
    muscleGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    muscleButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#ffffff",
    },
    muscleButtonSelected: {
        borderColor: "#2563eb",
        backgroundColor: "#dbeafe",
    },
    muscleButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        textTransform: "capitalize",
    },
    muscleButtonTextSelected: {
        color: "#1d4ed8",
    },
    actions: {
        gap: 12,
        marginTop: 8,
    },
    message: {
        fontSize: 16,
        fontWeight: "600",
    },
    draftCard: {
        gap: 6,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#ffffff",
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 4,
    },

    section: {
        gap: 12,
        marginTop: 8,
    },

    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
    },

    exerciseList: {
        gap: 10,
    },

    exerciseCard: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
    },

    exerciseCardSelected: {
        borderColor: "#2563eb",
        backgroundColor: "#dbeafe",
    },

    exerciseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },

    exerciseName: {
        flex: 1,
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    exerciseNameSelected: {
        color: "#1d4ed8",
    },

    exerciseMeta: {
        marginTop: 6,
        fontSize: 14,
        color: "#6b7280",
        textTransform: "capitalize",
    },

    selectBadge: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6b7280",
    },

    selectBadgeSelected: {
        color: "#1d4ed8",
    },
});