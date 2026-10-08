import { formatTrainingSeconds, trainingTotalSeconds, type TrainingConfig, type CardioCompletion } from "@workout-app/shared";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import { getExerciseLibraryRequest } from "../../services/exerciseApi";
import { getWorkoutSessionByIdRequest } from "../../services/workoutSessionApi";
import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";
import LoadingState from "../../components/Loading/LoadingState";

import styles from "./WorkoutResultPage.module.css";

type WorkoutSet = {
    weight: number;
    reps: number;
};

type WorkoutSessionExercise = {
    exerciseId: string | null;
    exerciseName: string;
    training?: TrainingConfig;
    cardioCompletion?: CardioCompletion;
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

export default function WorkoutResultPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams();

    const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(
        null,
    );
    const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>(
        [],
    );

    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isLoadingMuscles, setIsLoadingMuscles] = useState(false);

    const [sessionError, setSessionError] = useState("");
    const [muscleError, setMuscleError] = useState("");

    useEffect(() => {
        async function loadWorkoutSession() {
            if (!sessionId) {
                navigate("/");
                return;
            }

            setSessionError("");
            setIsLoadingSession(true);

            try {
                const data: WorkoutSession =
                    await getWorkoutSessionByIdRequest(sessionId);

                setWorkoutSession(data);
            } catch (error) {
                setSessionError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load workout result.",
                );
            } finally {
                setIsLoadingSession(false);
            }
        }

        loadWorkoutSession();
    }, [sessionId, navigate]);



    useEffect(() => {
        if (!workoutSession) {
            return;
        }

        const options = {
            page: 1,
            limit: 100
        }

        async function loadExerciseLibrary() {
            setMuscleError("");
            setIsLoadingMuscles(true);


            try {
                const data = await getExerciseLibraryRequest(options);
                setExerciseLibrary(data.exercises);
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

    if (isLoadingSession && !workoutSession) {
        return (
            <LoadingState
                layout="result"
                className={styles.page}
                title="Workout result"
                message="Loading your saved workout..."
                color="var(--color-success)"
            />
        );
    }

    if (sessionError || !workoutSession) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <h1 className={styles.title}>No workout result found</h1>
                    <p className={styles.stateText}>
                        {sessionError || "This workout result could not be loaded."}
                    </p>

                    <div className={styles.actions}>
                        <Button onClick={() => navigate("/")}>
                            Back to home
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
                        Your session is in workout history.
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
                        <h2 className={styles.sectionTitle}>Muscles trained</h2>

                        <p className={styles.sectionText}>
                            Primary and secondary muscles targeted by your exercises.
                        </p>

                        {isLoadingMuscles && exerciseLibrary.length === 0 && (
                            <LoadingState
                                layout="muscles"
                                variant="inline"
                                message="Loading muscle profile..."
                                color="var(--color-success)"
                            />
                        )}

                        {muscleError && (
                            <p className={styles.errorText} role="alert">{muscleError}</p>
                        )}

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
                        <h2 className={styles.sectionTitle}>Recorded sets</h2>
                        <p className={styles.sectionText}>
                            Sets, reps, and weight recorded during this workout.
                        </p>
                    </div>
                </div>

                {workoutSession.exercises.length === 0 && <Card className={styles.stateCard}><p className={styles.stateText}>No sets were recorded for this session.</p></Card>}
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
                                {exercise.training && exercise.training.format !== "strength" && <p>Planned: {formatTrainingSeconds(trainingTotalSeconds(exercise.training))} · Actual: {formatTrainingSeconds(exercise.cardioCompletion?.elapsedSeconds ?? 0)}{exercise.training.format === "intervals" ? ` · ${exercise.cardioCompletion?.completedRounds ?? 0} of ${exercise.training.rounds} rounds` : ""}{exercise.cardioCompletion?.manual ? " · Completed manually" : ""}</p>}
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
                <Button variant="secondary" onClick={() => navigate("/")}>
                    Back to home
                </Button>

                <Button onClick={() => navigate("/workout-select")}>
                    Start another workout
                </Button>
            </div>
        </Box>
    );
}
