import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { templateKeys } from "../../query/queryClient";
import { useNavigate } from "../../routes/navigationHooks";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { useAuth } from "../../context/AuthContext";

import {
    getPublicWorkoutTemplatesRequest,
    startWorkoutFromTemplateRequest,
} from "../../services/workoutTemplateApi";

import type { WorkoutTemplate } from "@workout-app/shared";

import styles from "./TemplatesPage.module.css";

export default function TemplatesPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const templatesQuery = useQuery({
        queryKey: templateKeys.public,
        queryFn: ({ signal }) => getPublicWorkoutTemplatesRequest(signal),
    });
    const publicTemplates = templatesQuery.data ?? [];
    const error = templatesQuery.error?.message ?? "";
    const isLoading = templatesQuery.isFetching;
    const hasLoadedOnce = !templatesQuery.isPending;
    const [actionError, setActionError] = useState("");
    const startMutation = useMutation({ mutationFn: startWorkoutFromTemplateRequest });
    const startingTemplateId = startMutation.isPending ? startMutation.variables : null;
    async function handleStartTemplate(templateId: string) {
        if (!isAuthenticated) {
            setActionError("You need to log in before starting a workout.");
            return;
        }

        setActionError("");


        try {
            const draft = await startMutation.mutateAsync(templateId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(error.message);
            } else {
                setActionError("Failed to start workout from template");
            }
        }
    }

    function renderTemplateCard(template: WorkoutTemplate) {
        const isStarting = startingTemplateId === template._id;

        return (
            <Card key={template._id} className={styles.templateCard}>
                <div className={styles.cardHeader}>
                    <div>

                        <h2 className={styles.templateName}>
                            {template.name}
                        </h2>

                        <p className={styles.templateDescription}>
                            {template.description || "No description."}
                        </p>
                    </div>

                    <span className={styles.categoryBadge}>
                        {template.category}
                    </span>
                </div>

                <div className={styles.exerciseList}>
                    {template.exercises.length > 0 ? (
                        template.exercises.map((exercise, index) => (
                            <div
                                key={exercise._id ?? `${template._id}-${index}`}
                                className={styles.exerciseItem}
                            >
                                <span>{exercise.order + 1}.</span>

                                <span>
                                    {exercise.exerciseName || "Missing exercise"}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyText}>No exercises added.</p>
                    )}
                </div>

                <div className={styles.templateActions}>
                    <Button
                        type="button"
                        disabled={!isAuthenticated || startingTemplateId !== null}
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
                        onClick={() =>
                            navigate(
                                `/templates/pre-made/templates-details/${template._id}`,
                            )
                        }
                    >
                        View details
                    </Button>
                </div>
            </Card>
        );
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="cards"
                className={styles.page}
                title="Workout templates"
                message="Loading workout templates..."
            />
        );
    }

    if (error && publicTemplates.length === 0) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{error}</p>
                </Card>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            {error && <p className={styles.errorText} role="alert">{error}</p>}
            {isLoading && <LoadingAnnouncement message="Updating content..." />}
            <header className={styles.header}>
                <p className={styles.kicker}>Workout templates</p>

                <h1 className={styles.title}>Browse templates</h1>

                <p className={styles.subtitle}>
                    Choose a routine for your next session.
                </p>

                {!isAuthenticated && (
                    <p className={styles.loginHint}>
                        You can browse workouts while logged out, but you need to
                        log in to start a workout.
                    </p>
                )}
            </header>

            {actionError && (
                <Card className={styles.actionErrorCard}>
                    <p className={styles.errorText} role="alert">{actionError}</p>
                </Card>
            )}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>

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
                </div>

                {publicTemplates.length > 0 ? (
                    <div className={styles.templateGrid} aria-busy={isLoading}>
                        {publicTemplates.map((template) =>
                            renderTemplateCard(template),
                        )}
                    </div>
                ) : (
                    <Card className={styles.stateCard}>
                        <p>No templates available yet.</p>
                    </Card>
                )}
            </section>
        </Box>
    );
}
