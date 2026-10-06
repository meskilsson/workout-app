import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
    getWorkoutSessionByIdRequest,
    repeatWorkoutSessionRequest,
} from "../../services/workoutSessionApi";

import { getExerciseLibraryRequest } from "../../services/exerciseApi";
import formatDuration from "../../utils/formatDuration";
import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import type { WorkoutSession } from "@workout-app/shared";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import styles from "./WorkoutHistoryDetailPage.module.css";

type LocationState = {
    workoutSession?: WorkoutSession;
};

type ExerciseLibraryItem = {
    _id: string;
    name: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
};

export default function WorkoutHistoryDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const state = location.state as LocationState | null;

    const [session, setSession] = useState<WorkoutSession | null>(
        state?.workoutSession ?? null,
    );

    const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>(
        [],
    );

    const [isLoading, setIsLoading] = useState(!state?.workoutSession);
    const [isLoadingMuscles, setIsLoadingMuscles] = useState(false);

    const [error, setError] = useState("");
    const [muscleError, setMuscleError] = useState("");
    const [actionError, setActionError] = useState("");

    const [isRepeatingWorkout, setIsRepeatingWorkout] = useState(false);

    useEffect(() => {
        if (session) return;

        if (!id) {
            setError("Workout session id is missing.");
            setIsLoading(false);
            return;
        }

        const sessionId = id;

        async function loadSession() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getWorkoutSessionByIdRequest(sessionId);
                setSession(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load workout session",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadSession();
    }, [id, session]);

    useEffect(() => {
        if (!session) return;

        async function loadExerciseLibrary() {
            setMuscleError("");
            setIsLoadingMuscles(true);

            try {
                const options = {
                    page: 1,
                    limit: 100,
                };

                const data = await getExerciseLibraryRequest(options);
                setExerciseLibrary(data.exercises);
            } catch (err) {
                setMuscleError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load muscle profile.",
                );
            } finally {
                setIsLoadingMuscles(false);
            }
        }

        loadExerciseLibrary();
    }, [session]);

    async function handleTrainAgain() {
        if (!session?._id) {
            setActionError("Workout session id is missing.");
            return;
        }

        setActionError("");
        setIsRepeatingWorkout(true);

        try {
            const draft = await repeatWorkoutSessionRequest(session._id);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(error.message);
            } else {
                setActionError("Failed to prepare workout.");
            }
        } finally {
            setIsRepeatingWorkout(false);
        }
    }

    const trainedMuscles = useMemo(() => {
        if (!session) {
            return {
                primaryMuscles: [] as string[],
                secondaryMuscles: [] as string[],
            };
        }

        const primaryMuscles = new Set<string>();
        const secondaryMuscles = new Set<string>();

        for (const sessionExercise of session.exercises) {
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
    }, [session, exerciseLibrary]);

    if (isLoading && !session) {
        return (
            <LoadingState
                layout="details"
                className={styles.page}
                title="Workout history"
                message="Loading workout details..."
            />
        );
    }

    if (error || !session) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.kicker}>Workout history</p>
                    <h1 className={styles.title}>Workout details</h1>

                    <p className={styles.errorText}>
                        {error || "Workout session not found."}
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/profile/workouts")}
                    >
                        Back to history
                    </Button>
                </Card>
            </Box>
        );
    }

    const totalSets = session.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const totalExercises = session.exercises.length;
    const completedDate = formatCompletedDate(session.endedAt);
    const endTime = formatEndTime(session.endedAt);
    const duration = formatDuration(session.startedAt, session.endedAt);

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Workout history</p>

                    <h1 className={styles.title}>Workout details</h1>

                    <p className={styles.subtitle}>
                        A full breakdown of this saved workout session.
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleTrainAgain}
                        disabled={isRepeatingWorkout}
                    >
                        {isRepeatingWorkout ? (
                            <LoadingPredator
                                size="small"
                                color="currentColor"
                                label="Preparing..."
                                showLabel
                            />
                        ) : (
                            "Train again"
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/profile/workouts")}
                    >
                        Back to history
                    </Button>
                </div>
            </div>

            {actionError && (
                <Card className={styles.actionErrorCard}>
                    <p className={styles.errorText}>{actionError}</p>
                </Card>
            )}

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

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Duration</span>
                        <span className={styles.summaryValue}>{duration}</span>
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

                        {isLoadingMuscles && exerciseLibrary.length === 0 && (
                            <LoadingState
                                layout="muscles"
                                variant="inline"
                                message="Loading muscle profile..."
                                color="var(--color-success)"
                            />
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
                        <h2 className={styles.sectionTitle}>Exercises</h2>

                        <p className={styles.sectionText}>
                            Sets, reps, and weight recorded during this workout.
                        </p>
                    </div>
                </div>

                <div className={styles.exerciseList}>
                    {session.exercises.map((exercise, exerciseIndex) => (
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
                                {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className={styles.setRow}>
                                        <span className={styles.setIndex}>
                                            Set {setIndex + 1}
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
        </Box>
    );
}