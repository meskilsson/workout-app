import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getWorkoutSessionByIdRequest } from "../../services/workoutSessionApi";
import formatDuration from "../../utils/formatDuration";
import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import type { WorkoutSession } from "@workout-app/shared";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";

import styles from "./WorkoutHistoryDetailPage.module.css";

type LocationState = {
    workoutSession?: WorkoutSession;
};


export default function WorkoutHistoryDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const state = location.state as LocationState | null;

    const [session, setSession] = useState<WorkoutSession | null>(
        state?.workoutSession ?? null,
    );
    const [isLoading, setIsLoading] = useState(!state?.workoutSession);
    const [error, setError] = useState("");

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

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.kicker}>Workout history</p>
                    <h1 className={styles.title}>Workout details</h1>
                    <p className={styles.stateText}>Loading workout details...</p>
                </Card>
            </Box>
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
                        Back to workout history
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

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/profile/workouts")}
                >
                    Back to history
                </Button>
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

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Duration</span>
                        <span className={styles.summaryValue}>{duration}</span>
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