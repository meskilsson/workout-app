import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal/Modal";

import {
    deleteExerciseRequest,
    getExerciseLibraryRequest,
} from "../../services/exerciseApi";

import styles from "./ProfileExercisesPage.module.css";

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

export default function ProfileExercisesPage() {
    const navigate = useNavigate();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function loadExercises() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getExerciseLibraryRequest({
                    page: 1,
                    limit: 100,
                });

                const customExercises = data.exercises.filter(
                    (exercise) => exercise.isCustom,
                );

                setExercises(customExercises);
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
    }, []);

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

    if (isLoading) {
        return (
            <Card className={styles.stateCard}>
                <p className={styles.stateText}>Loading exercises...</p>
            </Card>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercises</p>
                    <h2 className={styles.title}>My custom exercises</h2>
                    <p className={styles.subtitle}>
                        Manage the exercises you have created yourself.
                    </p>
                </div>

                <Button onClick={() => navigate("/create-exercise")}>
                    Create Exercise
                </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{error}</p>
                </Card>
            )}

            {exercises.length === 0 ? (
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>
                        You have not created any custom exercises yet.
                    </p>
                </Card>
            ) : (
                <div className={styles.exerciseList}>
                    {exercises.map((exercise) => (
                        <Card key={exercise._id} className={styles.exerciseCard}>
                            <div className={styles.exerciseTopRow}>
                                <div>
                                    <h3 className={styles.exerciseName}>
                                        {exercise.name}
                                    </h3>

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
                                        variant="danger"
                                        onClick={() => setExerciseToDelete(exercise)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {exercise.primaryMuscles &&
                                exercise.primaryMuscles.length > 0 && (
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

                        <Button
                            variant="danger"
                            onClick={handleConfirmDeleteExercise}
                            disabled={isDeleting}
                        >
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
        </div>
    );
}