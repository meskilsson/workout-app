import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import { useAuth } from "../../context/AuthContext";

import {
    getMyWorkoutTemplatesRequest,
    getPublicWorkoutTemplatesRequest,
    startWorkoutFromTemplateRequest,
} from "../../services/workoutTemplateApi";

import type { WorkoutTemplate } from "@workout-app/shared";

import styles from "./TemplatesPage.module.css";

export default function TemplatesPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [publicTemplates, setPublicTemplates] = useState<WorkoutTemplate[]>([]);
    const [myTemplates, setMyTemplates] = useState<WorkoutTemplate[]>([]);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [startingTemplateId, setStartingTemplateId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        async function fetchTemplates() {
            setError("");
            setIsLoading(true);

            try {
                const publicData = await getPublicWorkoutTemplatesRequest();
                setPublicTemplates(publicData);

                if (isAuthenticated) {
                    const myData = await getMyWorkoutTemplatesRequest();
                    setMyTemplates(myData);
                } else {
                    setMyTemplates([]);
                }
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Something went wrong");
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchTemplates();
    }, [isAuthenticated]);

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

    function renderTemplateCard(template: WorkoutTemplate, label: string) {
        const isStarting = startingTemplateId === template._id;

        return (
            <Card key={template._id} className={styles.templateCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <p className={styles.templateType}>{label}</p>

                        <h2 className={styles.templateName}>{template.name}</h2>

                        <p className={styles.templateDescription}>
                            {template.description || "No description."}
                        </p>
                    </div>

                    <span className={styles.categoryBadge}>
                        {template.category}
                    </span>
                </div>

                <div className={styles.exerciseList}>
                    {template.exercises.map((exercise) => (
                        <div key={exercise._id} className={styles.exerciseItem}>
                            <span>{exercise.order + 1}.</span>
                            <span>{exercise.exerciseName}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.templateActions}>
                    <Button
                        type="button"
                        disabled={!isAuthenticated || isStarting}
                        onClick={() => handleStartTemplate(template._id)}
                    >
                        {isStarting ? "Starting..." : "Start workout"}
                    </Button>
                </div>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p>Loading templates...</p>
                </Card>
            </Box>
        );
    }

    if (error) {
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
            <header className={styles.header}>
                <p className={styles.kicker}>Workout templates</p>

                <h1 className={styles.title}>Templates</h1>

                <p className={styles.subtitle}>
                    Browse pre-made workout templates and choose what you want to train.
                </p>

                {!isAuthenticated && (
                    <p className={styles.loginHint}>
                        You can browse templates while logged out, but you need to log in
                        to start a workout or create your own templates.
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
                        <h2 className={styles.sectionTitle}>Pre-made templates</h2>
                        <p className={styles.sectionText}>
                            Templates available for everyone to browse.
                        </p>
                    </div>
                </div>

                {publicTemplates.length > 0 ? (
                    <div className={styles.templateGrid}>
                        {publicTemplates.map((template) =>
                            renderTemplateCard(template, "Pre-made"),
                        )}
                    </div>
                ) : (
                    <Card className={styles.stateCard}>
                        <p>No public templates found.</p>
                    </Card>
                )}
            </section>

            {isAuthenticated && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>My templates</h2>
                            <p className={styles.sectionText}>
                                Templates you have created yourself.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate("/create-template")}
                        >
                            Create template
                        </Button>
                    </div>

                    {myTemplates.length > 0 ? (
                        <div className={styles.templateGrid}>
                            {myTemplates.map((template) =>
                                renderTemplateCard(template, "My template"),
                            )}
                        </div>
                    ) : (
                        <Card className={styles.stateCard}>
                            <p>You have not created any templates yet.</p>
                        </Card>
                    )}
                </section>
            )}
        </Box>
    );
}