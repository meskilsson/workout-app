import { displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useQuery } from "@tanstack/react-query";
import { exerciseDetailOptions } from "../../query/resourceQueries";
import { useParams, useNavigate } from "../../routes/navigationHooks";

import styles from "./ExerciseDetailsPage.module.css";
import LoadingState from "../../components/Loading/LoadingState";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";


import { useAuth } from "../../context/AuthContext";

export default function ExerciseDetailsPage() {
    useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const exerciseQuery = useQuery(exerciseDetailOptions(user?._id, id ?? ""));
    const exercise = exerciseQuery.data;
    const error = !id ? t("ExerciseDetailsPage.exerciseDetailsIdIsMissing") : (exerciseQuery.error ? friendlyError(exerciseQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const isLoading = !!id && exerciseQuery.isPending;

    if (isLoading && !exercise) {
        return (
            <LoadingState
                layout="exerciseDetails"
                className={styles.page}
                title={t("common.exerciseDetails")}
                message={t("ExerciseDetailsPage.loadingExerciseDetails")}
            />
        );
    }

    if (!exercise) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.stateTitle}>{t("common.exerciseDetails")}</p>

                    <p className={styles.errorText}>
                        {error || t("common.exerciseDetailsMissing")}
                    </p>

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
                </Card>
            </Box>
        );
    }

    const primaryMuscles = exercise.primaryMuscles ?? [];
    const secondaryMuscles = exercise.secondaryMuscles ?? [];
    const imageUrl = exercise.imageUrl?.trim() || "";
    const hasImage = imageUrl.length > 0;

    return (
        <Box className={styles.page}>
            <header className={styles.header}>
                <div>

                    <h1 className={styles.title}>{exercise.name}</h1>

                    <p className={styles.subtitle}> {t("ExerciseDetailsPage.equipmentTechniqueAndTargetMuscles")} </p>
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


            </header>

            <Card className={styles.summaryCard}>
                <div
                    className={`${styles.exerciseGrid} ${hasImage ? styles.withImage : styles.withoutImage
                        }`}
                >
                    <section className={styles.infoColumn}>
                        <p className={styles.description}>
                            {exercise.description || t("common.noDescription")}
                        </p>

                        <div className={styles.quickInfo}>
                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>{t("common.type")}</span>
                                <span className={styles.quickInfoValue}>
                                    {displayValue(exercise.exerciseType)}
                                </span>
                            </div>

                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>{t("common.equipment")}</span>
                                <span className={styles.quickInfoValue}>
                                    {displayValue(exercise.equipment)}
                                </span>
                            </div>

                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>{t("common.difficulty")}</span>
                                <span className={styles.quickInfoValue}>
                                    {displayValue(exercise.difficulty)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.instructionsBlock}>
                            <h3 className={styles.sectionTitle}>{t("common.instructions")}</h3>

                            <p className={styles.instructions}>
                                {exercise.instructions || t("common.noInstructions")}
                            </p>
                        </div>
                    </section>

                    <section className={`${styles.visualColumn} ${styles.muscleColumn}`}>
                        <div className={styles.cardDummy}>
                            <MuscleDummy
                                variant="mini"
                                primaryMuscles={primaryMuscles}
                                secondaryMuscles={secondaryMuscles}
                            />
                        </div>
                    </section>

                    {hasImage && (
                        <section className={`${styles.visualColumn} ${styles.imageColumn}`}>
                            <img
                                className={styles.exerciseImage}
                                src={imageUrl}
                                alt={exercise.name}
                            />
                        </section>
                    )}
                </div>
            </Card>
        </Box>
    );
}
