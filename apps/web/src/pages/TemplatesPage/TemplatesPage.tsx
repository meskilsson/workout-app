import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
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
    useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const templatesQuery = useQuery({
        queryKey: templateKeys.public,
        queryFn: ({ signal }) => getPublicWorkoutTemplatesRequest(signal),
    });
    const publicTemplates = templatesQuery.data ?? [];
    const error = (templatesQuery.error ? friendlyError(templatesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const isLoading = templatesQuery.isFetching;
    const hasLoadedOnce = !templatesQuery.isPending;
    const [actionError, setActionError] = useState("");
    const startMutation = useMutation({ mutationFn: startWorkoutFromTemplateRequest });
    const startingTemplateId = startMutation.isPending ? startMutation.variables : null;
    async function handleStartTemplate(templateId: string) {
        if (!isAuthenticated) {
            setActionError(t("TemplatesPage.youNeedToLogInBeforeStartingAWorkout"));
            return;
        }

        setActionError("");


        try {
            const draft = await startMutation.mutateAsync(templateId);
            navigate(`/workout/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(friendlyError(error));
            } else {
                setActionError(t("common.failedToStartWorkoutFromTemplate"));
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
                            {template.description || t("common.noDescriptionShort")}
                        </p>
                    </div>

                    <span className={styles.categoryBadge}>
                        {displayValue(template.category)}
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
                                    {exercise.exerciseName || t("common.missingExercise")}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyText}>{t("common.noExercisesAdded")}</p>
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
                        onClick={() =>
                            navigate(
                                `/templates/pre-made/templates-details/${template._id}`,
                            )
                        }
                    > {t("common.viewDetails")} </Button>
                </div>
            </Card>
        );
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="cards"
                className={styles.page}
                title={t("common.workoutTemplates")}
                message={t("TemplatesPage.loadingWorkoutTemplates")}
            />
        );
    }

    if (error && publicTemplates.length === 0) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </Card>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
            {isLoading && <LoadingAnnouncement message={t("common.updatingContent")} />}
            <header className={styles.header}>
                <p className={styles.kicker}>{t("common.workoutTemplates")}</p>

                <h1 className={styles.title}>{t("TemplatesPage.browseTemplates")}</h1>

                <p className={styles.subtitle}> {t("TemplatesPage.chooseARoutineForYourNextSession")} </p>

                {!isAuthenticated && (
                    <p className={styles.loginHint}> {t("TemplatesPage.youCanBrowseWorkoutsWhileLoggedOutButYou")} </p>
                )}
            </header>

            {actionError && (
                <Card className={styles.actionErrorCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(actionError)}</p>
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
                    aria-label={t("common.goBack")}
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
                        <p>{t("TemplatesPage.noTemplatesAvailableYet")}</p>
                    </Card>
                )}
            </section>
        </Box>
    );
}
