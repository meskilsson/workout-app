import { ArrowLeft, Trash2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import {
    getMyWorkoutSessionsRequest,
    repeatWorkoutSessionRequest,
    deleteWorkoutSessionRequest,

} from "../../services/workoutSessionApi";

import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import type { WorkoutSession } from "@workout-app/shared";

import styles from "./ProfileWorkoutsPage.module.css";

export default function ProfileWorkoutsPage() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [repeatingSessionId, setRepeatingSessionId] = useState<string | null>(
        null,
    );
    const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
    const [deleteAction, setDeleteAction] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

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
                setHasLoadedOnce(true);
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

    async function handleDeleteSession(sessionId: string) {
        setDeleteAction("");
        setDeleteSessionId(sessionId);
        setIsDeleting(true);

        try {
            await deleteWorkoutSessionRequest(sessionId);

            setSessions((currentSessions) =>
                currentSessions.filter((session) => session._id !== sessionId),
            );


        } catch (error) {
            if (error instanceof Error) {
                setDeleteAction(error.message || "Failed to delete");
            } else {
                setDeleteAction("Unable to complete this request. Please try again.");
            }
        } finally {
            setIsDeleting(false);
            setDeleteSessionId(null);
        }
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="list"
                className={styles.page}
                variant="card"
                title="Workout history"
                message="Loading your workouts..."
            />
        );
    }

    return (
        <div className={styles.page}>
            {isLoading && <LoadingAnnouncement message="Updating content..." />}
            <div className={styles.header}>
                <div>


                    <h1 className={styles.title}>Workout history</h1>

                    <p className={styles.subtitle}>
                        Review your saved workout sessions.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                        onClick={() => navigate(-1)}
                    >
                        <Icon icon={ArrowLeft} />
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
                    <p className={styles.errorText} role="alert">{error}</p>
                </Card>
            )}

            {actionError && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{actionError}</p>
                </Card>
            )}

            {deleteAction && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{deleteAction}</p>
                </Card>
            )}

            {sessions.length === 0 && !error ? (
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>No workouts saved yet.</p>
                </Card>
            ) : (
                <div className={styles.sessionList} aria-busy={isLoading}>
                    {sessions.map((session) => {
                        const totalSets = session.exercises.reduce(
                            (sum, exercise) => sum + exercise.sets.length,
                            0,
                        );

                        const completedDate = formatCompletedDate(session.endedAt);
                        const endTime = formatEndTime(session.endedAt);
                        const isRepeatingThisSession =
                            repeatingSessionId === session._id;

                        const isDeletingThisSession = deleteSessionId === session._id && isDeleting;

                        return (
                            <Card key={session._id} className={styles.sessionCard}>
                                <div className={styles.sessionTopRow}>
                                    <div>
                                        <h3 className={styles.sessionTitle}>
                                            {completedDate}
                                        </h3>

                                        <p className={styles.sessionDate}>
                                            Completed at {endTime}
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
                                            {isRepeatingThisSession ? (
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
                                            View details
                                        </Button>
                                    </div>
                                </div>

                                <p className={styles.sessionSummary}>
                                    {session.exercises.length} exercises / {totalSets} sets
                                </p>

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
                                <div className={styles.deleteButton}>
                                    <Button
                                        type="button"
                                        variant="danger" icon={Trash2}
                                        disabled={isDeleting || Boolean(repeatingSessionId)}
                                        onClick={() => handleDeleteSession(session._id)}
                                    >
                                        {isDeletingThisSession ? (
                                            <LoadingPredator
                                                size="small"
                                                color="currentColor"
                                                label="Deleting..."
                                                showLabel
                                            />
                                        ) : (
                                            "Delete"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
