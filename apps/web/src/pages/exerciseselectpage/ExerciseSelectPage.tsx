import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getExerciseLibraryRequest, getPublicExercisesRequest } from "../../services/exerciseApi";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import "../../components/ui/button/button.css";
import "../../components/ui/box/box.css";
import "../../components/ui/cards/card.css";

type Exercise = {
    _id: string;
    name: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    exerciseType?: "strength" | "cardio" | "mobility";
    equipment?: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
    isCustom: boolean;
};

type SelectedMuscleGroup = {
    id: string;
    title: string;
};

type LocationState = {
    selectedMuscleGroups: SelectedMuscleGroup[];
};

export default function ExerciseSelectPage() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state as LocationState | null;

    const selectedMuscleGroups = state?.selectedMuscleGroups ?? [];



    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const muscleGroupMap: Record<string, string[]> = {
        chest: ["chest"],
        back: ["back"],
        shoulders: ["shoulders"],
        biceps: ["biceps"],
        triceps: ["triceps"],
        legs: ["quads", "hamstrings", "glutes", "calves"],
        core: ["core"],
    };

    useEffect(() => {
        async function loadExercises() {
            setError("");
            setIsLoading(true);

            try {
                const data = isAuthenticated
                    ? await getExerciseLibraryRequest()
                    : await getPublicExercisesRequest();

                setExercises(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load exercises");
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadExercises();
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedMuscleGroups.length === 0) {
            navigate("/workout-select");
        }
    }, [selectedMuscleGroups, navigate]);

    function handleToggleExercise(exerciseId: string) {
        setSelectedExercises((prev) =>
            prev.includes(exerciseId)
                ? prev.filter((id) => id !== exerciseId)
                : [...prev, exerciseId],
        );
    }

    const groupedExercises = useMemo(() => {
        return selectedMuscleGroups.map((group) => {
            const targetMuscles = muscleGroupMap[group.id] ?? [];

            const matchingExercises = exercises.filter((exercise) => {
                const primary =
                    exercise.primaryMuscles?.map((muscle) => muscle.trim().toLowerCase()) ?? [];

                const secondary =
                    exercise.secondaryMuscles?.map((muscle) => muscle.trim().toLowerCase()) ?? [];

                return targetMuscles.some(
                    (muscle) => primary.includes(muscle) || secondary.includes(muscle),
                );
            });

            return {
                ...group,
                exercises: matchingExercises,
            };
        });
    }, [selectedMuscleGroups, exercises]);

    const chosenExercises = exercises.filter((exercise) =>
        selectedExercises.includes(exercise._id),
    );

    function handleContinue() {
        navigate("/workout-summary", {
            state: { selectedExercises: chosenExercises },
        });
    }

    if (isLoading) {
        return (
            <Box className="exercise-select-page">
                <h1>Select Exercises</h1>
                <p>Loading exercises...</p>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="exercise-select-page">
                <h1>Select Exercises</h1>
                <p>{error}</p>
            </Box>
        );
    }

    return (
        <Box className="exercise-select-page">
            <h1>Select Exercises</h1>

            <Box className="muscle-group-grid">
                {groupedExercises.map((group) => (
                    <Box key={group.id} className="exercise-group">
                        <h2>{group.title}</h2>

                        <Box className="exercise-card-grid">
                            {group.exercises.length > 0 ? (
                                group.exercises.map((exercise) => (
                                    <Card
                                        key={exercise._id}
                                        className={`exercise-card ${selectedExercises.includes(exercise._id)
                                            ? "muscle-group-card--selected"
                                            : ""
                                            }`}
                                        onClick={() => handleToggleExercise(exercise._id)}
                                    >
                                        {exercise.name}
                                    </Card>
                                ))
                            ) : (
                                <p>No exercises found for this muscle group.</p>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>

            <Button onClick={handleContinue} disabled={chosenExercises.length === 0}>
                Continue
            </Button>
        </Box>
    );
}