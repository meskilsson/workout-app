import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import {
    getExerciseLibraryRequest,
    getPublicExercisesRequest,
} from "../../services/exerciseApi";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import styles from "./LibraryPage.module.css";

type Exercise = {
    _id: string;
    name: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    exerciseType?: "strength" | "cardio" | "mobility";
    equipment?:
    | "bodyweight"
    | "dumbbell"
    | "barbell"
    | "machine"
    | "kettlebell"
    | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
    isCustom: boolean;
};

export default function LibraryPage() {
    const { isAuthenticated } = useAuth();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
                setError(err instanceof Error ? err.message : "Failed to load exercises");
            } finally {
                setIsLoading(false);
            }
        }

        loadExercises();
    }, [isAuthenticated]);

    const filteredExercises = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return exercises;
        }

        return exercises.filter((exercise) => {
            const primaryMuscles = exercise.primaryMuscles ?? [];
            const secondaryMuscles = exercise.secondaryMuscles ?? [];

            return (
                exercise.name.toLowerCase().includes(normalizedSearch) ||
                exercise.exerciseType?.toLowerCase().includes(normalizedSearch) ||
                exercise.equipment?.toLowerCase().includes(normalizedSearch) ||
                exercise.difficulty?.toLowerCase().includes(normalizedSearch) ||
                primaryMuscles.some((muscle) =>
                    muscle.toLowerCase().includes(normalizedSearch),
                ) ||
                secondaryMuscles.some((muscle) =>
                    muscle.toLowerCase().includes(normalizedSearch),
                )
            );
        });
    }, [exercises, searchTerm]);

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.stateText}>Loading exercises...</p>
                </div>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.errorText}>{error}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.subtitle}>
                        Browse exercises by muscle, equipment, type, or difficulty.
                    </p>
                </div>

                <div className={styles.countBadge}>
                    {filteredExercises.length} exercise
                    {filteredExercises.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search exercises, muscles, or equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredExercises.length > 0 ? (
                <div className={styles.exerciseGrid}>
                    {filteredExercises.map((exercise) => (
                        <Card key={exercise._id} className={styles.exerciseCard}>
                            <div className={styles.exerciseCardTop}>
                                <div>
                                    <h2 className={styles.exerciseName}>{exercise.name}</h2>

                                    <div className={styles.exerciseMeta}>
                                        {exercise.exerciseType && (
                                            <span>{exercise.exerciseType}</span>
                                        )}

                                        {exercise.equipment && <span>{exercise.equipment}</span>}

                                        {exercise.difficulty && (
                                            <span>{exercise.difficulty}</span>
                                        )}

                                        {exercise.isCustom && <span>custom</span>}
                                    </div>
                                </div>

                                <div className={styles.cardDummy}>
                                    <MuscleDummy
                                        variant="mini"
                                        primaryMuscles={exercise.primaryMuscles ?? []}
                                        secondaryMuscles={exercise.secondaryMuscles ?? []}
                                    />
                                </div>
                            </div>

                            <div className={styles.muscleInfo}>
                                {exercise.primaryMuscles &&
                                    exercise.primaryMuscles.length > 0 && (
                                        <div>
                                            <p className={styles.muscleLabel}>Primary</p>

                                            <div className={styles.muscleTags}>
                                                {exercise.primaryMuscles.map((muscle) => (
                                                    <span
                                                        key={muscle}
                                                        className={styles.primaryTag}
                                                    >
                                                        {muscle}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {exercise.secondaryMuscles &&
                                    exercise.secondaryMuscles.length > 0 && (
                                        <div>
                                            <p className={styles.muscleLabel}>Secondary</p>

                                            <div className={styles.muscleTags}>
                                                {exercise.secondaryMuscles.map((muscle) => (
                                                    <span
                                                        key={muscle}
                                                        className={styles.secondaryTag}
                                                    >
                                                        {muscle}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className={styles.stateCard}>
                    <p className={styles.stateText}>No exercises found.</p>
                </div>
            )}
        </Box>
    );
}