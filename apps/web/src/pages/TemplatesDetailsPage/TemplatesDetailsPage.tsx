import { formatNumber, displayValue, translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useParams, useNavigate } from "../../routes/navigationHooks";
import { useQuery, useQueries } from "@tanstack/react-query";
import { exerciseDetailOptions, templateDetailOptions } from "../../query/resourceQueries";
import { useAuth } from "../../context/AuthContext";

import type { Exercise } from "@workout-app/shared";

import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import LoadingState from "../../components/Loading/LoadingState";

import { formatTrainingSeconds, trainingTotalSeconds } from "@workout-app/shared";
import styles from "./TemplatesDetailsPage.module.css";

type TemplatesDetailsPageProps = {
    templateSource: "public" | "my";
};

function formatCategory(category: string) {
    return displayValue(category
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "));
}

export default function TemplatesDetailsPage({
    templateSource,
}: TemplatesDetailsPageProps) {
    useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();

    const templateQuery = useQuery(templateDetailOptions(templateSource, user?._id, id ?? ""));
    const template = templateQuery.data;
    const exerciseIds = [...new Set(
        template?.exercises.map(item => item.exercise?._id).filter(
            (exerciseId): exerciseId is string => !!exerciseId,
        ) ?? [],
    )];
    const exerciseQueries = useQueries({
        queries: exerciseIds.map(exerciseId => exerciseDetailOptions(user?._id, exerciseId)),
    });
    const exerciseDetails = exerciseQueries.map(query => query.data).filter(
        (exercise): exercise is Exercise => !!exercise,
    );
    const isLoading = !!id && templateQuery.isPending;
    const error = !id ? t("TemplatesDetailsPage.missingTemplateId") : !template && templateQuery.error
        ? friendlyError(templateQuery.error) : "";

    if (isLoading && !template) {
        return (
            <LoadingState
                layout="templateDetails"
                className={styles.page}
                title={t("common.workoutTemplate")}
                message={t("common.loadingWorkoutDetails")}
            />
        );
    }

    if (error) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </Card>
            </Box>
        );
    }

    if (!template) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p>{t("TemplatesDetailsPage.noWorkoutTemplateFound")}</p>
                </Card>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <header className={styles.header}>
                <p className={styles.kicker}>{t("common.workoutTemplate")}</p>

                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>{template.name}</h1>

                        <p className={styles.subtitle}>
                            {template.description || t("common.workoutOverview")}
                        </p>
                    </div>
                </div>
            </header>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>{t("common.exercises")}</h2>

                        <p className={styles.sectionText}> {t("TemplatesDetailsPage.exerciseOrderTechniqueAndPlannedSets")} </p>

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

                    <span className={styles.categoryBadge}>
                        {formatCategory(template.category)}
                    </span>
                </div>

                {template.exercises.length === 0 && <Card className={styles.stateCard}><p>{t("TemplatesDetailsPage.thisTemplateHasNoExercises")}</p></Card>}
                <div className={styles.exerciseCardGrid}>
                    {template.exercises.map((templateExercise, index) => {
                        const exercise = templateExercise.exercise;

                        if (!exercise) {
                            return (
                                <Card
                                    key={templateExercise._id ?? `missing-${index}`}
                                    className={styles.exerciseCard}
                                >
                                    <div className={styles.exerciseContent}>
                                        <div className={styles.exerciseInfo}>
                                            <div>
                                                <p className={styles.exerciseKicker}> {t("TemplatesDetailsPage.missingExercise")} </p>

                                                <h3 className={styles.exerciseName}>
                                                    {templateExercise.exerciseName ||
                                                        t("common.exerciseUnavailable")}
                                                </h3>
                                            </div>

                                            <p className={styles.emptyText}> {t("TemplatesDetailsPage.thisExerciseIsUnavailableUpdateTheTemplateToReplace")} </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        }

                        const fullExercise = exerciseDetails.find(
                            (exerciseDetail) => exerciseDetail._id === exercise._id,
                        );

                        const primaryMuscles =
                            fullExercise?.primaryMuscles ??
                            exercise.primaryMuscles ??
                            [];

                        const secondaryMuscles =
                            fullExercise?.secondaryMuscles ??
                            exercise.secondaryMuscles ??
                            [];

                        const plannedSets = templateExercise.plannedSets ?? [];

                        return (
                            <Card
                                key={templateExercise._id}
                                className={styles.exerciseCard}
                            >
                                <div className={styles.orderPill}>
                                    <p className={styles.exerciseOrder}>
                                        {templateExercise.order + 1}.
                                    </p>
                                </div>

                                <div className={styles.exerciseContent}>
                                    <div className={styles.exerciseInfo}>
                                        <div>
                                            <p className={styles.exerciseKicker}>
                                                {fullExercise?.exerciseType ||
                                                    exercise.exerciseType ||
                                                    t("common.exercise")}
                                            </p>

                                            <h3 className={styles.exerciseName}>
                                                {templateExercise.exerciseName}
                                            </h3>
                                        </div>

                                        <div className={styles.metaGrid}>
                                            <div className={styles.metaItem}>
                                                <span>{t("common.equipment")}</span>

                                                <strong>
                                                    {fullExercise?.equipment ||
                                                        exercise.equipment ||
                                                        t("common.notSpecified")}
                                                </strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span>{t("common.difficulty")}</span>

                                                <strong>
                                                    {fullExercise?.difficulty ||
                                                        exercise.difficulty ||
                                                        t("common.notSpecified")}
                                                </strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span>{t("TemplatesDetailsPage.sets")}</span>

                                                <strong>
                                                    {plannedSets.length || "—"}
                                                </strong>
                                            </div>
                                        </div>

                                        {fullExercise?.description && (
                                            <div className={styles.descriptionBlock}>
                                                <p className={styles.blockTitle}> {t("common.description")} </p>

                                                <p className={styles.descriptionText}>
                                                    {fullExercise.description}
                                                </p>
                                            </div>
                                        )}

                                        <details className={styles.instructionsBlock}>
                                            <summary className={styles.blockTitle}>{t("TemplatesDetailsPage.technique")}</summary>

                                            <p className={styles.instructions}>
                                                {fullExercise?.instructions ||
                                                    t("common.noInstructionsAvailable")}
                                            </p>
                                        </details>

                                        <div className={styles.setsBlock}>
                                            <p className={styles.blockTitle}> {t("TemplatesDetailsPage.plannedSets")} </p>

                                            {templateExercise.training && templateExercise.training.format !== "strength" && <p>{templateExercise.training.format === "intervals" ? t("TemplatesDetailsPage.valueRoundsValueWorkValueRest", { value0: templateExercise.training.rounds, value1: formatTrainingSeconds(templateExercise.training.workSeconds), value2: formatTrainingSeconds(templateExercise.training.restSeconds) }) : t("TemplatesDetailsPage.continuousCardio")}{t("common.total")} {formatTrainingSeconds(trainingTotalSeconds(templateExercise.training))}</p>}
                                            {plannedSets.length > 0 ? (
                                                <div className={styles.setList}>
                                                    {plannedSets.map((plannedSet, index) => (
                                                        <div
                                                            key={index}
                                                            className={styles.setRow}
                                                        >
                                                            <span>{t("common.set")} {index + 1}</span>

                                                            <strong>
                                                                {plannedSet.weight
                                                                    ? t("TemplatesDetailsPage.valueKg", { value0: formatNumber(plannedSet.weight) })
                                                                    : t("TemplatesDetailsPage.noWeight")}
                                                            </strong>

                                                            <strong>
                                                                {plannedSet.reps
                                                                    ? t("TemplatesDetailsPage.valueReps", { value0: formatNumber(plannedSet.reps) })
                                                                    : t("TemplatesDetailsPage.noReps")}
                                                            </strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={styles.emptyText}> {t("TemplatesDetailsPage.noPlannedSetsAdded")} </p>
                                            )}
                                        </div>
                                    </div>

                                    <aside className={styles.visualPanel}>
                                        {fullExercise?.imageUrl && (
                                            <img
                                                className={styles.exerciseImage}
                                                src={fullExercise.imageUrl}
                                                alt={templateExercise.exerciseName}
                                            />
                                        )}

                                        <div className={styles.muscleGroups}>
                                            <div className={styles.muscleDummy}>
                                                <MuscleDummy
                                                    variant="full"
                                                    primaryMuscles={primaryMuscles}
                                                    secondaryMuscles={secondaryMuscles}
                                                />
                                            </div>
                                        </div>

                                        {fullExercise?.videoUrl && (
                                            <a
                                                className={styles.videoLink}
                                                href={fullExercise.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            > {t("TemplatesDetailsPage.watchExerciseVideo")} </a>
                                        )}
                                    </aside>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </Box>
    );
}
