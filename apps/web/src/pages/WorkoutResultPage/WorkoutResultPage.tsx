import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import { getExerciseLibraryRequest } from "../../services/exerciseApi";
import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import styles from "./WorkoutResultPage.module.css";

type WorkoutSet = {
    weight: number;
    reps: number;
};

type WorkoutSessionExercise = {
    exerciseId: string | null;
    exerciseName: string;
    sets: WorkoutSet[];
};

type WorkoutSession = {
    _id: string;
    userId: string;
    exercises: WorkoutSessionExercise[];
    startedAt?: string | null;
    endedAt: string;
    createdAt: string;
    updatedAt: string;
};

type ExerciseLibraryItem = {
    _id: string;
    name: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
};

type LocationState = {
    workoutSession: WorkoutSession;
};

export default function WorkoutResultPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const workoutSession = state?.workoutSession;

    const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
    const [isLoadingMuscles, setIsLoadingMuscles] = useState(false);
    const [muscleError, setMuscleError] = useState("");

    useEffect(() => {
        if (!workoutSession) return;

        async function loadExerciseLibrary() {
            setMuscleError("");
            setIsLoadingMuscles(true);

            try {
                const data = await getExerciseLibraryRequest();
                setExerciseLibrary(data);
            } catch (error) {
                setMuscleError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load trained muscles.",
                );
            } finally {
                setIsLoadingMuscles(false);
            }
        }

        loadExerciseLibrary();
    }, [workoutSession]);

    const trainedMuscles = useMemo(() => {
        if (!workoutSession) {
            return {
                primaryMuscles: [] as string[],
                secondaryMuscles: [] as string[],
            };
        }

        const primaryMuscles = new Set<string>();
        const secondaryMuscles = new Set<string>();

        for (const sessionExercise of workoutSession.exercises) {
            const matchedExercise = exerciseLibrary.find((exercise) => {
                const matchesId =
                    sessionExercise.exerciseId &&
                    exercise._id === sessionExercise.exerciseId;

                const matchesName =
                    exercise.name.trim().toLowerCase() ===
                    sessionExercise.exerciseName.trim().toLowerCase();

                return matchesId || matchesName;
            });

            if (!matchedExercise) {
                continue;
            }

            for (const muscle of matchedExercise.primaryMuscles ?? []) {
                primaryMuscles.add(muscle);
            }

            for (const muscle of matchedExercise.secondaryMuscles ?? []) {
                secondaryMuscles.add(muscle);
            }
        }

        for (const muscle of primaryMuscles) {
            secondaryMuscles.delete(muscle);
        }

        return {
            primaryMuscles: [...primaryMuscles],
            secondaryMuscles: [...secondaryMuscles],
        };
    }, [workoutSession, exerciseLibrary]);

    if (!workoutSession) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.kicker}>Workout result</p>
                    <h1 className={styles.title}>No workout result found</h1>
                    <p className={styles.stateText}>
                        This page needs saved workout data.
                    </p>

                    <div className={styles.actions}>
                        <Button onClick={() => navigate("/dashboard")}>
                            Back to dashboard
                        </Button>
                    </div>
                </Card>
            </Box>
        );
    }

    const totalExercises = workoutSession.exercises.length;

    const totalSets = workoutSession.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const completedDate = formatCompletedDate(workoutSession.endedAt);
    const endTime = formatEndTime(workoutSession.endedAt);

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Workout complete</p>
                    <h1 className={styles.title}>Workout saved</h1>
                    <p className={styles.subtitle}>
                        Saved successfully to your workout history.
                    </p>
                </div>
            </div>

            <Card className={styles.summaryCard}>
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Completed</span>
                        <span className={styles.summaryValue}>{completedDate}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>End time</span>
                        <span className={styles.summaryValue}>{endTime}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Exercises</span>
                        <span className={styles.summaryValue}>{totalExercises}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total sets</span>
                        <span className={styles.summaryValue}>{totalSets}</span>
                    </div>
                </div>
            </Card>

            <Card className={styles.muscleCard}>
                <div className={styles.muscleCardContent}>
                    <div className={styles.muscleInfo}>
                        <p className={styles.kicker}>Muscle profile</p>
                        <h2 className={styles.sectionTitle}>Muscles trained</h2>

                        <p className={styles.sectionText}>
                            This highlights the primary and secondary muscles targeted by
                            this workout.
                        </p>

                        {isLoadingMuscles && (
                            <p className={styles.stateText}>Loading muscle profile...</p>
                        )}

                        {muscleError && (
                            <p className={styles.errorText}>{muscleError}</p>
                        )}

                        <div className={styles.muscleLegend}>
                            <span className={styles.primaryLegend}>Primary</span>
                            <span className={styles.secondaryLegend}>Secondary</span>
                        </div>

                        <div className={styles.muscleTags}>
                            {trainedMuscles.primaryMuscles.map((muscle) => (
                                <span key={muscle} className={styles.primaryTag}>
                                    {muscle}
                                </span>
                            ))}

                            {trainedMuscles.secondaryMuscles.map((muscle) => (
                                <span key={muscle} className={styles.secondaryTag}>
                                    {muscle}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.muscleDummyWrap}>
                        <MuscleDummy
                            variant="full"
                            primaryMuscles={trainedMuscles.primaryMuscles}
                            secondaryMuscles={trainedMuscles.secondaryMuscles}
                        />
                    </div>
                </div>
            </Card>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Exercise breakdown</h2>
                        <p className={styles.sectionText}>
                            Sets, reps, and weight recorded during this workout.
                        </p>
                    </div>
                </div>

                <div className={styles.exerciseList}>
                    {workoutSession.exercises.map((exercise, exerciseIndex) => (
                        <Card
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            className={styles.exerciseCard}
                        >
                            <div className={styles.exerciseHeader}>
                                <div>
                                    <p className={styles.exerciseNumber}>
                                        Exercise {exerciseIndex + 1}
                                    </p>

                                    <h3 className={styles.exerciseTitle}>
                                        {exercise.exerciseName}
                                    </h3>
                                </div>

                                <span className={styles.setCount}>
                                    {exercise.sets.length}{" "}
                                    {exercise.sets.length === 1 ? "set" : "sets"}
                                </span>
                            </div>

                            <div className={styles.setsList}>
                                {exercise.sets.map((set, index) => (
                                    <div key={index} className={styles.setRow}>
                                        <span className={styles.setIndex}>
                                            Set {index + 1}
                                        </span>

                                        <span className={styles.setValue}>
                                            {set.weight} kg
                                        </span>

                                        <span className={styles.setValue}>
                                            {set.reps} reps
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <div className={styles.actions}>
                <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                    Back to dashboard
                </Button>

                <Button onClick={() => navigate("/workout-select")}>
                    Start another workout
                </Button>
            </div>
        </Box>
    );
}