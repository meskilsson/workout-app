import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    const [publicTemplates, setPublicTemplates] = useState<WorkoutTemplate[]>([]);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [startingTemplateId, setStartingTemplateId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        async function fetchPublicTemplates() {
            setError("");
            setIsLoading(true);

            try {
                const publicData = await getPublicWorkoutTemplatesRequest();
                setPublicTemplates(publicData);
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

        fetchPublicTemplates();
    }, []);

    async function handleStartTemplate(templateId: string) {
        if (!isAuthenticated) {
            setActionError("You need to log in before starting a workout.");
            return;
        }

        setActionError("");
        setStartingTemplateId(templateId);

        try {
            const draft = await startWorkoutFromTemplateRequest(templateId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(error.message);
            } else {
                setActionError("Failed to start workout from template");
            }
        } finally {
            setStartingTemplateId(null);
        }
    }

    function renderTemplateCard(template: WorkoutTemplate) {
        const isStarting = startingTemplateId === template._id;

        return (
            <Card key={template._id} className={styles.templateCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <p className={styles.templateType}>Pre-made</p>

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
                        disabled={!isAuthenticated || isStarting}
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
                title="Pre-made workouts"
                message="Loading workout templates..."
            />
        );
    }

    if (error && publicTemplates.length === 0) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{error}</p>
                </Card>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            {error && <p className={styles.errorText} role="alert">{error}</p>}
            {isLoading && <LoadingAnnouncement message="Updating content..." />}
            <header className={styles.header}>
                <p className={styles.kicker}>Pre-made workouts</p>

                <h1 className={styles.title}>Browse workouts</h1>

                <p className={styles.subtitle}>
                    Browse pre-made workouts and choose what you want to train.
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
                    <p className={styles.errorText}>{actionError}</p>
                </Card>
            )}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>
                            Pre-made workouts
                        </h2>

                        <p className={styles.sectionText}>
                            Workouts available for everyone to browse.
                        </p>

                        <Button
                            type="button"
                            variant="secondary"
                            style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                            iconOnly
                            className={styles.backButton}
                            onClick={() => navigate(-1)}
                        >
                            <span className={styles.buttonArrow}>←</span>
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
                        <p>No pre-made workouts found.</p>
                    </Card>
                )}
            </section>
        </Box>
    );
}