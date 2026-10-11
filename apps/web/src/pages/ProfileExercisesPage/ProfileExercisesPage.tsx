import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { cardRest, cardHover } from "../../components/motion/presets";
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
    useTranslation();
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
    const error = actionError || (exercisesQuery.error ? friendlyError(exercisesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
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
                setError(friendlyError(err));
            } else {
                setError(t("common.failedToDeleteExercise"));
            }
        }
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="list"
                className={styles.page}
                variant="card"
                title={t("ProfileExercisesPage.yourExercises")}
                message={t("ProfileExercisesPage.loadingCustomExercises")}
            />
        );
    }

    return (
        <div className={styles.page}>
            {isLoading && <LoadingAnnouncement message={t("common.updatingContent")} />}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t("common.myExercises")}</h1>
                    <p className={styles.subtitle}> {t("ProfileExercisesPage.editOrRemoveYourCustomMovements")} </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
                        onClick={() => navigate(-1)}

                    >
                        <Icon icon={ArrowLeft} />
                    </Button>
                </div>

                <Button icon={Plus} onClick={() => navigate("/create-exercise")}> {t("common.createExercise")} </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </Card>
            )}

            {exercises.length === 0 && !error ? (
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}> {t("ProfileExercisesPage.noCustomExercisesYetCreateOneToAddA")} </p>
                </Card>
            ) : (
                <div className={styles.exerciseList} aria-busy={isLoading}>
                    {exercises.map((exercise) => (
                        <Card key={exercise._id} animate={{ ...cardRest, backgroundColor: "var(--exercise-card-background)" }} whileHover={{ ...cardHover, backgroundColor: "var(--exercise-card-hover-background)" }} className={styles.exerciseCard}>
                            <div className={styles.exerciseTopRow}>
                                <div>
                                    <h3 className={styles.exerciseName}>
                                        {exercise.name}
                                    </h3>

                                    <div className={styles.exerciseMeta}>
                                        {exercise.exerciseType && (
                                            <span className={styles.exerciseMetaItem}>
                                                {displayValue(exercise.exerciseType)}
                                            </span>
                                        )}

                                        {exercise.difficulty && (
                                            <span className={styles.exerciseMetaItem}>
                                                {displayValue(exercise.difficulty)}
                                            </span>
                                        )}

                                        {exercise.equipment && (
                                            <span className={styles.exerciseMetaItem}>
                                                {displayValue(exercise.equipment)}
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
                                    > {t("common.edit")} </Button>

                                    <Button
                                        variant="danger" icon={Trash2}
                                        onClick={() => setExerciseToDelete(exercise)}
                                    > {t("common.delete")} </Button>
                                </div>
                            </div>

                            {exercise.primaryMuscles &&
                                exercise.primaryMuscles.length > 0 && (
                                    <div className={styles.muscleTags}>
                                        {exercise.primaryMuscles.map((muscle) => (
                                            <span
                                                key={`${exercise._id}-${displayValue(muscle)}`}
                                                className={styles.exerciseTag}
                                            >
                                                {displayValue(muscle)}
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
                title={t("ProfileExercisesPage.deleteExercise")}
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
                        > {t("common.cancel")} </Button>

                        <Button
                            variant="danger" icon={Trash2}
                            onClick={handleConfirmDeleteExercise}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label={t("common.deleting")}
                                    showLabel
                                />
                            ) : (
                                t("common.delete")
                            )}
                        </Button>
                    </>
                }
            >
                <p className={styles.modalText}> {t("common.areYouSureYouWantToDelete")}{" "}
                    <strong>{exerciseToDelete?.name}</strong>?
                </p>
                {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
            </Modal>
        </div>
    );
}
