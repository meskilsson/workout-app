import { ArrowLeft, Trash2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { sessionListOptions } from "../../query/resourceQueries";
import { useRepeatSessionMutation, useDeleteSessionMutation } from "../../query/useSessionMutations";
import { useNavigate } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";


import styles from "./ProfileWorkoutsPage.module.css";

export default function ProfileWorkoutsPage() {
    const navigate = useNavigate();

    const { user } = useAuth();
    const sessionsQuery = useQuery(sessionListOptions(user?._id ?? ""));
    const sessions = sessionsQuery.data ?? [];
    const isLoading = sessionsQuery.isFetching;
    const hasLoadedOnce = !sessionsQuery.isPending;
    const error = sessionsQuery.error?.message ?? "";
    const [actionError, setActionError] = useState("");
    const [deleteAction, setDeleteAction] = useState("");
    const repeatMutation = useRepeatSessionMutation();
    const deleteMutation = useDeleteSessionMutation();
    const repeatingSessionId = repeatMutation.isPending ? repeatMutation.variables : null;
    const deleteSessionId = deleteMutation.isPending ? deleteMutation.variables : null;
    const isDeleting = deleteMutation.isPending;

    async function handleTrainAgain(sessionId: string) {
        setActionError("");

        try {
            const draft = await repeatMutation.mutateAsync(sessionId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(error.message);
            } else {
                setActionError("Failed to prepare workout.");
            }
        }
    }

    async function handleDeleteSession(sessionId: string) {
        setDeleteAction("");

        try {
            await deleteMutation.mutateAsync(sessionId);

        } catch (error) {
            if (error instanceof Error) {
                setDeleteAction(error.message || "Failed to delete");
            } else {
                setDeleteAction("Unable to complete this request. Please try again.");
            }
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
