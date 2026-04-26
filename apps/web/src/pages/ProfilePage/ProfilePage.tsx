import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";


import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal/Modal";


import { getMyWorkoutSessionsRequest } from "../../services/workoutSessionApi";
import { deleteExerciseRequest } from "../../services/exerciseApi";
import styles from "./ProfilePage.module.css";
import type { WorkoutSession } from "@workout-app/shared";
import { getExerciseLibraryRequest } from "../../services/exerciseApi";


type Exercise = {
    _id: string;
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    isCustom: boolean;
};


export default function ProfilePage() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function loadProfileData() {
            setError("");
            setIsLoading(true);

            try {
                const [sessionsData, exercisesData] = await Promise.all([
                    getMyWorkoutSessionsRequest(),
                    getExerciseLibraryRequest(),
                ]);

                setSessions(sessionsData);
                setExercises(exercisesData);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load profile data");
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadProfileData();
    }, [])

    const customExercises = useMemo(() => {
        return exercises.filter((exercise) => exercise.isCustom)
    }, [exercises]);

    async function handleConfirmDeleteExercise() {
        if (!exerciseToDelete) return;

        setIsDeleting(true);
        setError("");

        try {
            await deleteExerciseRequest(exerciseToDelete._id);

            setExercises((prev) =>
                prev.filter((exercise) => exercise._id !== exerciseToDelete._id),
            );

            setExerciseToDelete(null);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to delete exercise");
            }
        } finally {
            setIsDeleting(false);
        }
    }



    return (
        <Box className={styles.page}>
            <Box className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Profile</h1>
                        <p className={styles.subtitle}>Your workouts and custom exercises.</p>
                    </div>

                    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>

                {isLoading ? (
                    <Card className={styles.stateCard}>
                        <p className={styles.stateText}>Loading profile...</p>
                    </Card>
                ) : (
                    <>
                        {error && (
                            <Card className={styles.stateCard}>
                                <p className={styles.errorText}>{error}</p>
                            </Card>
                        )}

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Workout History</h2>
                            </div>

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

                                        const completedAt = new Date(session.endedAt).toLocaleString();

                                        return (
                                            <Card key={session._id} className={styles.sessionCard}>
                                                <div className={styles.sessionTopRow}>
                                                    <div>
                                                        <h3 className={styles.sessionTitle}>Workout Session</h3>
                                                        <p className={styles.sessionDate}>{completedAt}</p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            navigate(`/profile/workouts/${session._id}`, {
                                                                state: { workoutSession: session },
                                                            })
                                                        }
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>

                                                <div className={styles.summaryGrid}>
                                                    <div className={styles.summaryItem}>
                                                        <span className={styles.summaryLabel}>Exercises</span>
                                                        <span className={styles.summaryValue}>
                                                            {session.exercises.length}
                                                        </span>
                                                    </div>

                                                    <div className={styles.summaryItem}>
                                                        <span className={styles.summaryLabel}>Total Sets</span>
                                                        <span className={styles.summaryValue}>{totalSets}</span>
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
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>My Custom Exercises</h2>

                                <Button onClick={() => navigate("/create-exercise")}>
                                    Create Exercise
                                </Button>
                            </div>

                            {customExercises.length === 0 ? (
                                <Card className={styles.stateCard}>
                                    <p className={styles.stateText}>You have not created any custom exercises yet.</p>
                                </Card>
                            ) : (
                                <div className={styles.exerciseList}>
                                    {customExercises.map((exercise) => (
                                        <Card key={exercise._id} className={styles.exerciseCard}>
                                            <div className={styles.exerciseTopRow}>
                                                <div>
                                                    <h3 className={styles.exerciseName}>{exercise.name}</h3>

                                                    <div className={styles.exerciseMeta}>
                                                        {exercise.exerciseType && (
                                                            <span className={styles.exerciseMetaItem}>
                                                                {exercise.exerciseType}
                                                            </span>
                                                        )}

                                                        {exercise.difficulty && (
                                                            <span className={styles.exerciseMetaItem}>
                                                                {exercise.difficulty}
                                                            </span>
                                                        )}

                                                        {exercise.equipment && (
                                                            <span className={styles.exerciseMetaItem}>
                                                                {exercise.equipment}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={styles.exerciseActions}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            navigate(`/edit-exercise/${exercise._id}`)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => setExerciseToDelete(exercise)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
                                                <div className={styles.muscleTags}>
                                                    {exercise.primaryMuscles.map((muscle) => (
                                                        <span
                                                            key={`${exercise._id}-${muscle}`}
                                                            className={styles.exerciseTag}
                                                        >
                                                            {muscle}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {exercise.description && (
                                                <p className={styles.exerciseDescription}>
                                                    {exercise.description}
                                                </p>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                <Modal
                    title="Delete exercise?"
                    isOpen={!!exerciseToDelete}
                    onClose={() => {
                        if (!isDeleting) {
                            setExerciseToDelete(null);
                        }
                    }}
                    actions={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setExerciseToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>

                            <Button onClick={handleConfirmDeleteExercise} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </>
                    }
                >
                    <p className={styles.modalText}>
                        Are you sure you want to delete{" "}
                        <strong>{exerciseToDelete?.name}</strong>?
                    </p>
                </Modal>
            </Box>
        </Box>
    );
}