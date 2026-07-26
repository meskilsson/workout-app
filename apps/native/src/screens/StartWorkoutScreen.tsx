import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import Button from "../components/UI/Button/Button";
import { useAuth } from "../context/AuthContext";
import { exerciseLibraryRequest, type Exercise } from "../services/exerciseApi";
import {
    completeWorkoutDraftRequest,
    createWorkoutDraftRequest,
    getCurrentWorkoutDraftRequest,
    startWorkoutDraftRequest,
    updateWorkoutDraftExercisesRequest,
    updateWorkoutDraftSetsRequest,
    type Muscle,
    type WorkoutDraft,
    type WorkoutDraftSet,
    type WorkoutSession,
} from "../services/workoutDraftApi";

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
    const [completedSession, setCompletedSession] =
        useState<WorkoutSession | null>(null);

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    // ======= HELPERS =======

    function isValidCompletedSet(set: WorkoutDraftSet) {
        return (
            typeof set.weight === "number" &&
            typeof set.reps === "number" &&
            Number.isFinite(set.weight) &&
            Number.isFinite(set.reps) &&
            set.weight >= 0 &&
            set.reps >= 1
        );
    }

    function getExercisesWithoutValidSets(draftToCheck: WorkoutDraft) {
        return draftToCheck.exercises.filter((exercise) => {
            return !exercise.sets.some(isValidCompletedSet);
        });
    }

    function toggleMuscle(muscle: Muscle) {
        setSelectedMuscles((currentMuscles) => {
            const isAlreadySelected = currentMuscles.includes(muscle);

            if (isAlreadySelected) {
                return currentMuscles.filter(
                    (currentMuscle) => currentMuscle !== muscle,
                );
            }

            return [...currentMuscles, muscle];
        });
    }

    function toggleExercise(exerciseId: string) {
        setSelectedExerciseIds((currentExerciseIds) => {
            const isAlreadySelected = currentExerciseIds.includes(exerciseId);

            if (isAlreadySelected) {
                return currentExerciseIds.filter(
                    (currentExerciseId) => currentExerciseId !== exerciseId,
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

    function addSetToExercise(exerciseId: string) {
        if (!draft) {
            return;
        }

        const updatedExercises = draft.exercises.map((exercise) => {
            if (exercise.exerciseId !== exerciseId) {
                return exercise;
            }

            return {
                ...exercise,
                sets: [...exercise.sets, { weight: null, reps: null }],
            };
        });

        setDraft({
            ...draft,
            exercises: updatedExercises,
        });
    }

    function removeSetFromExercise(exerciseId: string, setIndex: number) {
        if (!draft) {
            return;
        }

        const updatedExercises = draft.exercises.map((exercise) => {
            if (exercise.exerciseId !== exerciseId) {
                return exercise;
            }

            return {
                ...exercise,
                sets: exercise.sets.filter((_, index) => index !== setIndex),
            };
        });

        setDraft({
            ...draft,
            exercises: updatedExercises,
        });
    }

    function updateExerciseSetValue(
        exerciseId: string,
        setIndex: number,
        field: keyof WorkoutDraftSet,
        value: string,
    ) {
        if (!draft) {
            return;
        }

        const normalizedValue = value.replace(",", ".");
        const numberValue = normalizedValue === "" ? null : Number(normalizedValue);

        const updatedExercises = draft.exercises.map((exercise) => {
            if (exercise.exerciseId !== exerciseId) {
                return exercise;
            }

            const updatedSets = exercise.sets.map((set, index) => {
                if (index !== setIndex) {
                    return set;
                }

                return {
                    ...set,
                    [field]: Number.isNaN(numberValue) ? null : numberValue,
                };
            });

            return {
                ...exercise,
                sets: updatedSets,
            };
        });

        setDraft({
            ...draft,
            exercises: updatedExercises,
        });
    }

    // ======= HANDLERS =======

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
            setCompletedSession(null);
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
                setCompletedSession(null);
                setSelectedMuscles(currentDraft.selectedMuscleGroups);

                setSelectedExerciseIds(
                    currentDraft.exercises.map((exercise) => exercise.exerciseId),
                );

                await loadExercisesForMuscles(currentDraft.selectedMuscleGroups);

                setMessage("Current draft loaded.");
            } else {
                setSelectedMuscles([]);
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
            setCompletedSession(null);
            setMessage("Workout started.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to start workout.");
            Alert.alert("Error", "Could not start the workout.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSaveExerciseSets(
        exerciseId: string,
        sets: WorkoutDraftSet[],
    ) {
        try {
            if (!token) {
                Alert.alert("Not logged in", "You need to log in first.");
                return;
            }

            if (!draft) {
                Alert.alert("No workout", "Load or start a workout first.");
                return;
            }

            if (draft.status !== "active") {
                Alert.alert(
                    "Workout not active",
                    "You can only save sets after starting the workout.",
                );
                return;
            }

            setIsLoading(true);
            setMessage("Saving sets...");

            const updatedDraft = await updateWorkoutDraftSetsRequest(
                token,
                draft._id,
                exerciseId,
                sets,
            );

            setDraft(updatedDraft);
            setMessage("Sets saved.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to save sets.");
            Alert.alert("Error", "Could not save sets.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCompleteWorkout() {
        try {
            if (!token) {
                Alert.alert("Not logged in", "You need to log in first.");
                return;
            }

            if (!draft) {
                Alert.alert("No workout", "Load or start a workout first.");
                return;
            }

            if (draft.status !== "active") {
                Alert.alert(
                    "Workout not active",
                    "You can only complete an active workout.",
                );
                return;
            }

            const exercisesWithoutValidSets = getExercisesWithoutValidSets(draft);

            if (exercisesWithoutValidSets.length > 0) {
                Alert.alert(
                    "Missing sets",
                    `Add at least one valid set for: ${exercisesWithoutValidSets
                        .map((exercise) => exercise.exerciseName)
                        .join(", ")}`,
                );
                return;
            }

            setIsLoading(true);
            setMessage("Completing workout...");

            const session = await completeWorkoutDraftRequest(token, draft._id);

            setCompletedSession(session);
            setDraft(null);
            setAvailableExercises([]);
            setSelectedExerciseIds([]);
            setSelectedMuscles([]);

            setMessage("Workout completed.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to complete workout.");
            Alert.alert("Error", "Could not complete workout.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
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
                >
                    {isLoading ? "Working..." : "Create workout draft"}
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
                                        {exercise.primaryMuscles?.join(", ") ||
                                            "No primary muscles"}
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
                        You have selected {draft.exercises.length} exercises. Start the
                        workout when you are ready to begin tracking sets.
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

            {draft && draft.status === "active" && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Active workout</Text>

                    <Text style={styles.description}>
                        Add sets for each exercise. Save each exercise when you are done
                        entering its sets.
                    </Text>

                    <View style={styles.activeExerciseList}>
                        {draft.exercises.map((exercise) => (
                            <View key={exercise.exerciseId} style={styles.activeExerciseCard}>
                                <Text style={styles.activeExerciseName}>
                                    {exercise.exerciseName}
                                </Text>

                                {exercise.sets.length === 0 && (
                                    <Text style={styles.exerciseMeta}>
                                        No sets yet. Add your first set.
                                    </Text>
                                )}

                                {exercise.sets.map((set, setIndex) => (
                                    <View key={setIndex} style={styles.setRow}>
                                        <Text style={styles.setNumber}>Set {setIndex + 1}</Text>

                                        <TextInput
                                            value={set.weight === null ? "" : String(set.weight)}
                                            onChangeText={(value) =>
                                                updateExerciseSetValue(
                                                    exercise.exerciseId,
                                                    setIndex,
                                                    "weight",
                                                    value,
                                                )
                                            }
                                            keyboardType="decimal-pad"
                                            placeholder="kg"
                                            style={styles.setInput}
                                        />

                                        <TextInput
                                            value={set.reps === null ? "" : String(set.reps)}
                                            onChangeText={(value) =>
                                                updateExerciseSetValue(
                                                    exercise.exerciseId,
                                                    setIndex,
                                                    "reps",
                                                    value,
                                                )
                                            }
                                            keyboardType="number-pad"
                                            placeholder="reps"
                                            style={styles.setInput}
                                        />

                                        <Pressable
                                            onPress={() =>
                                                removeSetFromExercise(exercise.exerciseId, setIndex)
                                            }
                                            style={styles.removeSetButton}
                                        >
                                            <Text style={styles.removeSetButtonText}>×</Text>
                                        </Pressable>
                                    </View>
                                ))}

                                <View style={styles.setActions}>
                                    <Button
                                        variant="secondary"
                                        onPress={() => addSetToExercise(exercise.exerciseId)}
                                        disabled={isLoading}
                                    >
                                        Add set
                                    </Button>

                                    <Button
                                        variant="primary"
                                        onPress={() =>
                                            handleSaveExerciseSets(exercise.exerciseId, exercise.sets)
                                        }
                                        disabled={isLoading}
                                    >
                                        Save sets
                                    </Button>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.completeSection}>
                        <Text style={styles.sectionTitle}>Finish workout</Text>

                        <Text style={styles.description}>
                            Complete the workout when every exercise has at least one valid
                            set.
                        </Text>

                        <Button
                            variant="primary"
                            onPress={handleCompleteWorkout}
                            disabled={isLoading}
                        >
                            Complete workout
                        </Button>
                    </View>
                </View>
            )}

            {completedSession && (
                <View style={styles.completedCard}>
                    <Text style={styles.cardTitle}>Workout completed</Text>

                    <Text style={styles.description}>
                        You completed {completedSession.exercises.length} exercises.
                    </Text>

                    {completedSession.exercises.map((exercise, exerciseIndex) => (
                        <View
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            style={styles.completedExercise}
                        >
                            <Text style={styles.activeExerciseName}>
                                {exercise.exerciseName}
                            </Text>

                            <Text style={styles.exerciseMeta}>
                                {exercise.sets.length} set
                                {exercise.sets.length === 1 ? "" : "s"}
                            </Text>

                            {exercise.sets.map((set, setIndex) => (
                                <Text key={setIndex} style={styles.completedSetText}>
                                    Set {setIndex + 1}: {set.weight} kg x {set.reps} reps
                                </Text>
                            ))}
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

    activeExerciseList: {
        gap: 14,
    },

    activeExerciseCard: {
        gap: 12,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#ffffff",
    },

    activeExerciseName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },

    setRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    setNumber: {
        width: 48,
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
    },

    setInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: "#ffffff",
    },

    removeSetButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fee2e2",
    },

    removeSetButtonText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#dc2626",
        lineHeight: 26,
    },

    setActions: {
        gap: 10,
    },

    completeSection: {
        gap: 12,
        marginTop: 10,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#ffffff",
    },

    completedCard: {
        gap: 14,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#ffffff",
    },

    completedExercise: {
        gap: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },

    completedSetText: {
        fontSize: 15,
        color: "#374151",
    },
});