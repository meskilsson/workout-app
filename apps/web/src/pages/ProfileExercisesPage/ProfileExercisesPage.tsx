import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { exerciseListOptions } from "../../query/resourceQueries";
import { useDeleteExerciseMutation } from "../../query/useExerciseMutations";
import { useNavigate } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal/Modal";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

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

    const { user } = useAuth();
    const exercisesQuery = useQuery({
        ...exerciseListOptions(user?._id, { page: 1, limit: 100 }),
        enabled: !!user,
    });
    const exercises = (exercisesQuery.data?.exercises ?? []).filter(exercise => exercise.isCustom);
    const isLoading = exercisesQuery.isFetching;
    const hasLoadedOnce = !exercisesQuery.isPending;
    const [actionError, setError] = useState("");
    const error = actionError || exercisesQuery.error?.message || "";
    const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
    const deleteMutation = useDeleteExerciseMutation();
    const isDeleting = deleteMutation.isPending;

    async function handleConfirmDeleteExercise() {
        if (!exerciseToDelete) return;

        setError("");

        try {
            await deleteMutation.mutateAsync(exerciseToDelete._id);

            setExerciseToDelete(null);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to delete exercise");
            }
        }
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="list"
                className={styles.page}
                variant="card"
                title="Your exercises"
                message="Loading custom exercises..."
            />
        );
    }

    return (
        <div className={styles.page}>
            {isLoading && <LoadingAnnouncement message="Updating content..." />}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My exercises</h1>
                    <p className={styles.subtitle}>
                        Edit or remove your custom movements.
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

                <Button icon={Plus} onClick={() => navigate("/create-exercise")}>
                    Create exercise
                </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{error}</p>
                </Card>
            )}

            {exercises.length === 0 && !error ? (
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>
                        No custom exercises yet. Create one to add a movement.
                    </p>
                </Card>
            ) : (
                <div className={styles.exerciseList} aria-busy={isLoading}>
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
                                        variant="danger" icon={Trash2}
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
                            variant="danger" icon={Trash2}
                            onClick={handleConfirmDeleteExercise}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
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
                    </>
                }
            >
                <p className={styles.modalText}>
                    Are you sure you want to delete{" "}
                    <strong>{exerciseToDelete?.name}</strong>?
                </p>
                {error && <p className={styles.errorText} role="alert">{error}</p>}
            </Modal>
        </div>
    );
}
