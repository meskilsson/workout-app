import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import {
    getMyWorkoutSessionsRequest,
    repeatWorkoutSessionRequest,
} from "../../services/workoutSessionApi";

import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import type { WorkoutSession } from "@workout-app/shared";

import styles from "./ProfileWorkoutsPage.module.css";

export default function ProfileWorkoutsPage() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [repeatingSessionId, setRepeatingSessionId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        async function loadWorkoutHistory() {
            setError("");
            setIsLoading(true);

            try {
                const sessionsData = await getMyWorkoutSessionsRequest();
                setSessions(sessionsData);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load workout history");
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadWorkoutHistory();
    }, []);

    async function handleTrainAgain(sessionId: string) {
        setActionError("");
        setRepeatingSessionId(sessionId);

        try {
            const draft = await repeatWorkoutSessionRequest(sessionId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(error.message);
            } else {
                setActionError("Failed to prepare workout.");
            }
        } finally {
            setRepeatingSessionId(null);
        }
    }

    if (isLoading) {
        return (
            <Card className={styles.stateCard}>
                <p className={styles.stateText}>Loading workout history...</p>
            </Card>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>History</p>

                    <h2 className={styles.title}>Workout history</h2>

                    <p className={styles.subtitle}>
                        Review your saved workout sessions.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        className={styles.backButton}
                        onClick={() => navigate(-1)}
                    >
                        <span className={styles.buttonArrow}>←</span>
                    </Button>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/workout-select")}
                >
                    Start workout
                </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{error}</p>
                </Card>
            )}

            {actionError && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{actionError}</p>
                </Card>
            )}

            {sessions.length === 0 ? (
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>No workouts saved yet.</p>
                </Card>
            ) : (
                <div className={styles.sessionList}>
                    {sessions.map((session) => {
                        const totalSets = session.exercises.reduce(
                            (sum, exercise) => sum + exercise.sets.length,
                            0,
                        );

                        const completedDate = formatCompletedDate(session.endedAt);
                        const endTime = formatEndTime(session.endedAt);
                        const isRepeatingThisSession =
                            repeatingSessionId === session._id;

                        return (
                            <Card key={session._id} className={styles.sessionCard}>
                                <div className={styles.sessionTopRow}>
                                    <div>
                                        <h3 className={styles.sessionTitle}>
                                            Workout Session
                                        </h3>

                                        <p className={styles.sessionDate}>
                                            {completedDate} at {endTime}
                                        </p>
                                    </div>

                                    <div className={styles.sessionActions}>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={Boolean(repeatingSessionId)}
                                            onClick={() =>
                                                handleTrainAgain(session._id)
                                            }
                                        >
                                            {isRepeatingThisSession
                                                ? "Preparing..."
                                                : "Train again"}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(
                                                    `/profile/workouts/${session._id}`,
                                                    {
                                                        state: {
                                                            workoutSession: session,
                                                        },
                                                    },
                                                )
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.summaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>
                                            Exercises
                                        </span>

                                        <span className={styles.summaryValue}>
                                            {session.exercises.length}
                                        </span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>
                                            Total Sets
                                        </span>

                                        <span className={styles.summaryValue}>
                                            {totalSets}
                                        </span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>
                                            End Time
                                        </span>

                                        <span className={styles.summaryValue}>
                                            {endTime}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.exercisePreview}>
                                    {session.exercises.slice(0, 3).map((exercise) => (
                                        <span
                                            key={`${session._id}-${exercise.exerciseName}`}
                                            className={styles.exerciseTag}
                                        >
                                            {exercise.exerciseName}
                                        </span>
                                    ))}

                                    {session.exercises.length > 3 && (
                                        <span className={styles.moreText}>
                                            +{session.exercises.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}