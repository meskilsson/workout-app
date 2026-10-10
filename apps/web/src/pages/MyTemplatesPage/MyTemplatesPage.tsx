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
    const error = actionError || templatesQuery.error?.message || "";
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
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to start workout from template");
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
                setError(error.message);
            } else {
                setError("Failed to prepare workout for editing");
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
                setError(error.message);
            } else {
                setError("Failed to delete workout template");
            }
        }
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="cards"
                className={styles.section}
                variant="card"
                title="Your templates"
                message="Loading your workout templates..."
            />
        );
    }

    return (
        <section className={styles.section}>
            {isLoading && <LoadingAnnouncement message="Updating content..." />}
            <div className={styles.sectionHeader}>
                <div>
                    <h1 className={styles.sectionTitle}>My templates</h1>

                    <p className={styles.sectionText}>
                        Your reusable training routines.
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

                <Button icon={Plus}
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/templates/create")}
                >
                    Create template
                </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{error}</p>
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
                                                "No description."}
                                        </p>
                                    </div>

                                    <span className={styles.categoryBadge}>
                                        {template.category}
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
                                                    {exercise.exerciseName ||
                                                        "Missing exercise"}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.emptyText}>
                                            No exercises added.
                                        </p>
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
                                                    label="Starting..."
                                                    showLabel
                                                />
                                            ) : (
                                                "Start workout"
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isBusy}
                                            onClick={() =>
                                                navigate(`/templates/my/templates-details/${template._id}`)
                                            }
                                        >
                                            View details
                                        </Button>
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
                                                    label="Preparing..."
                                                    showLabel
                                                />
                                            ) : (
                                                "Edit"
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger" icon={Trash2}
                                            disabled={isBusy}
                                            onClick={() => setTemplateToDelete(template)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className={styles.stateCard}>
                    <p>No templates yet. Create one to save a routine.</p>
                </Card>
            )}

            <Modal
                title="Delete workout template?"
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
                                    label="Deleting..."
                                    showLabel
                                />
                            ) : (
                                "Delete"
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setTemplateToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                    </div>
                }
            >
                <p>
                    Are you sure you want to delete{" "}
                    <strong>{templateToDelete?.name}</strong>? This cannot be
                    undone.
                </p>
                {error && <p className={styles.errorText} role="alert">{error}</p>}
            </Modal>
        </section>
    );
}
