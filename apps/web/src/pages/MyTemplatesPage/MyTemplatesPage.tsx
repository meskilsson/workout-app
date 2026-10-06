import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [startingTemplateId, setStartingTemplateId] = useState<string | null>(
        null,
    );

    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
        null,
    );

    const [templateToDelete, setTemplateToDelete] =
        useState<WorkoutTemplate | null>(null);

    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function fetchMyTemplates() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getMyWorkoutTemplatesRequest();
                setTemplates(data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Something went wrong");
                }
            } finally {
                setIsLoading(false);
                setHasLoadedOnce(true);
            }
        }

        fetchMyTemplates();
    }, []);

    async function handleStartTemplate(templateId: string) {
        setError("");
        setStartingTemplateId(templateId);

        try {
            const draft = await startWorkoutFromTemplateRequest(templateId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to start workout from template");
            }
        } finally {
            setStartingTemplateId(null);
        }
    }

    async function handleEditTemplate(templateId: string) {
        setError("");
        setEditingTemplateId(templateId);

        try {
            const draft = await createTemplateEditDraftRequest(templateId);
            navigate(`/exercise-select/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to prepare workout for editing");
            }
        } finally {
            setEditingTemplateId(null);
        }
    }

    async function handleConfirmDeleteTemplate() {
        if (!templateToDelete) return;

        setError("");
        setIsDeleting(true);

        try {
            await deleteWorkoutTemplateRequest(templateToDelete._id);

            setTemplates((prev) =>
                prev.filter((template) => template._id !== templateToDelete._id),
            );

            setTemplateToDelete(null);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to delete workout template");
            }
        } finally {
            setIsDeleting(false);
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
                    <h2 className={styles.sectionTitle}>My workouts</h2>

                    <p className={styles.sectionText}>
                        Workouts you have created yourself.
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
                    onClick={() => navigate("/templates/create")}
                >
                    Create workout
                </Button>
            </div>

            {error && (
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{error}</p>
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
                                        <p className={styles.templateType}>
                                            My workout
                                        </p>

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
                                            variant="danger"
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
                    <p>You have not created any workouts yet.</p>
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
                            variant="danger"
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
            </Modal>
        </section>
    );
}