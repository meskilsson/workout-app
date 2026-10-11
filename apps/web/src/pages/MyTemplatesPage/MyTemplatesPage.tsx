import ExerciseName from "../../components/exercises/ExerciseName";
import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { authKey, templateKeys } from "../../query/queryClient";
import { useNavigate } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal/Modal";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import {
    createTemplateEditDraftRequest,
    deleteWorkoutTemplateRequest,
    getMyWorkoutTemplatesRequest,
    startWorkoutFromTemplateRequest,
} from "../../services/workoutTemplateApi";

import type { WorkoutTemplate } from "@workout-app/shared";

import styles from "../TemplatesPage/TemplatesPage.module.css";

export default function MyTemplatesPage() {
    useTranslation();
    const navigate = useNavigate();

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = templateKeys.mine(user?._id ?? "");
    const templatesQuery = useQuery({
        queryKey,
        queryFn: ({ signal }) => getMyWorkoutTemplatesRequest(signal),
        enabled: !!user,
    });
    const templates = templatesQuery.data ?? [];
    const [actionError, setError] = useState("");
    const error = actionError || (templatesQuery.error ? friendlyError(templatesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const isLoading = templatesQuery.isFetching;
    const hasLoadedOnce = !templatesQuery.isPending;
    const startMutation = useMutation({ mutationFn: startWorkoutFromTemplateRequest });
    const editMutation = useMutation({ mutationFn: createTemplateEditDraftRequest });
    const deleteMutation = useMutation({
        mutationFn: deleteWorkoutTemplateRequest,
        onMutate: () => queryClient.cancelQueries({ queryKey }),
        onSuccess: (_, id) => {
            if (queryClient.getQueryData<{ _id: string }>(authKey)?._id !== user?._id) return;
            queryClient.setQueryData<WorkoutTemplate[]>(queryKey, previous => previous?.filter(template => template._id !== id));
            if (user?._id) queryClient.removeQueries({ queryKey: templateKeys.detail("my", user._id, id), exact: true });
            void queryClient.invalidateQueries({ queryKey });
        },
    });
    const startingTemplateId = startMutation.isPending ? startMutation.variables : null;
    const editingTemplateId = editMutation.isPending ? editMutation.variables : null;
    const isDeleting = deleteMutation.isPending;
    const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null);

    async function handleStartTemplate(templateId: string) {
        setError("");

        try {
            const draft = await startMutation.mutateAsync(templateId);
            navigate(`/workout/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(friendlyError(error));
            } else {
                setError(t("common.failedToStartWorkoutFromTemplate"));
            }
        }
    }

    async function handleEditTemplate(templateId: string) {
        setError("");

        try {
            const draft = await editMutation.mutateAsync(templateId);
            navigate(`/exercise-select/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(friendlyError(error));
            } else {
                setError(t("MyTemplatesPage.failedToPrepareWorkoutForEditing"));
            }
        }
    }

    async function handleConfirmDeleteTemplate() {
        if (!templateToDelete) return;

        setError("");

        try {
            await deleteMutation.mutateAsync(templateToDelete._id);
            setTemplateToDelete(null);
        } catch (error) {
            if (error instanceof Error) {
                setError(friendlyError(error));
            } else {
                setError(t("common.failedToDeleteWorkoutTemplate"));
            }
        }
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="cards"
                className={styles.section}
                variant="card"
                title={t("MyTemplatesPage.yourTemplates")}
                message={t("MyTemplatesPage.loadingYourWorkoutTemplates")}
            />
        );
    }

    return (
        <section className={styles.section}>
            {isLoading && <LoadingAnnouncement message={t("common.updatingContent")} />}
            <div className={styles.sectionHeader}>
                <div>
                    <h1 className={styles.sectionTitle}>{t("common.myTemplates")}</h1>

                    <p className={styles.sectionText}> {t("MyTemplatesPage.yourReusableTrainingRoutines")} </p>

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

                <Button icon={Plus}
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/templates/create")}
                > {t("common.createTemplate")} </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </Card>
            )}

            {templates.length > 0 ? (
                <div className={styles.templateGrid} aria-busy={isLoading}>
                    {templates.map((template) => {
                        const isStarting = startingTemplateId === template._id;
                        const isEditing = editingTemplateId === template._id;
                        const isBusy = Boolean(
                            startingTemplateId ||
                            editingTemplateId ||
                            templateToDelete ||
                            isDeleting,
                        );

                        const exercises = template.exercises ?? [];

                        return (
                            <Card
                                key={template._id}
                                className={styles.templateCard}
                            >
                                <div className={styles.cardHeader}>
                                    <div>

                                        <h2 className={styles.templateName}>
                                            {template.name}
                                        </h2>

                                        <p className={styles.templateDescription}>
                                            {template.description ||
                                                t("common.noDescriptionShort")}
                                        </p>
                                    </div>

                                    <span className={styles.categoryBadge}>
                                        {displayValue(template.category)}
                                    </span>
                                </div>

                                <div className={styles.exerciseList}>
                                    {exercises.length > 0 ? (
                                        exercises.map((exercise, index) => (
                                            <div
                                                key={
                                                    exercise._id ??
                                                    `${template._id}-${index}`
                                                }
                                                className={styles.exerciseItem}
                                            >
                                                <span>{exercise.order + 1}.</span>

                                                <span>
                                                    <ExerciseName id={exercise.exercise?._id} name={exercise.exerciseName || t("common.missingExercise")} />
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.emptyText}> {t("common.noExercisesAdded")} </p>
                                    )}
                                </div>

                                <div className={styles.templateCardActions}>
                                    <div className={styles.templateActionStack}>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={isBusy}
                                            onClick={() => handleStartTemplate(template._id)}
                                        >
                                            {isStarting ? (
                                                <LoadingPredator
                                                    size="small"
                                                    color="currentColor"
                                                    label={t("common.starting")}
                                                    showLabel
                                                />
                                            ) : (
                                                t("common.startWorkout")
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isBusy}
                                            onClick={() =>
                                                navigate(`/templates/my/templates-details/${template._id}`)
                                            }
                                        > {t("common.viewDetails")} </Button>
                                    </div>

                                    <div className={styles.templateActionStack}>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isBusy}
                                            onClick={() => handleEditTemplate(template._id)}
                                        >
                                            {isEditing ? (
                                                <LoadingPredator
                                                    size="small"
                                                    color="currentColor"
                                                    label={t("common.preparing")}
                                                    showLabel
                                                />
                                            ) : (
                                                t("common.edit")
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger" icon={Trash2}
                                            disabled={isBusy}
                                            onClick={() => setTemplateToDelete(template)}
                                        > {t("common.delete")} </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className={styles.stateCard}>
                    <p>{t("MyTemplatesPage.noTemplatesYetCreateOneToSaveARoutine")}</p>
                </Card>
            )}

            <Modal
                title={t("MyTemplatesPage.deleteWorkoutTemplate")}
                isOpen={Boolean(templateToDelete)}
                onClose={() => {
                    if (!isDeleting) {
                        setTemplateToDelete(null);
                    }
                }}
                actions={
                    <div className={styles.templateActions}>
                        <Button
                            type="button"
                            variant="danger" icon={Trash2}
                            onClick={handleConfirmDeleteTemplate}
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

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setTemplateToDelete(null)}
                            disabled={isDeleting}
                        > {t("common.cancel")} </Button>
                    </div>
                }
            >
                <p> {t("common.areYouSureYouWantToDelete")}{" "}
                    <strong>{templateToDelete?.name}</strong>{t("MyTemplatesPage.thisCannotBeUndone")} </p>
                {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
            </Modal>
        </section>
    );
}
