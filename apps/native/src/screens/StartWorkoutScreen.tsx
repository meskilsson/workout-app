import { Alert, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import Button from "../components/UI/Button/Button";
import { useAuth } from "../context/AuthContext";
import {
    createWorkoutDraftRequest,
    getCurrentWorkoutDraftRequest,
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
            setMessage(currentDraft ? "Current draft loaded." : "No current draft.");
        } catch (error) {
            console.log(error);
            setMessage("Failed to load current draft.");
            Alert.alert("Error", "Could not load current draft.");
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

            {draft && (
                <View style={styles.draftCard}>
                    <Text style={styles.cardTitle}>Current draft</Text>

                    <Text>Status: {draft.status}</Text>
                    <Text>Purpose: {draft.purpose}</Text>
                    <Text>Muscles: {draft.selectedMuscleGroups.join(", ")}</Text>
                    <Text>Exercises: {draft.exercises.length}</Text>
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
});