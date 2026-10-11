import { formatNumber, translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { motion } from "motion/react";
import { useMotionTransition } from "../../components/motion/useMotionTransition";
import { formatTrainingSeconds, trainingTotalSeconds } from "@workout-app/shared";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { exerciseListOptions, sessionDetailOptions } from "../../query/resourceQueries";
import { useNavigate, useParams } from "../../routes/navigationHooks";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";
import LoadingState from "../../components/Loading/LoadingState";

import styles from "./WorkoutResultPage.module.css";

export default function WorkoutResultPage() {
    useTranslation();
    const completionTiming = useMotionTransition(0.45);
    const navigate = useNavigate();
    const { sessionId } = useParams();

    const { user } = useAuth();
    const sessionQuery = useQuery(sessionDetailOptions(user?._id ?? "", sessionId ?? ""));
    const workoutSession = sessionQuery.data;
    const musclesQuery = useQuery({
        ...exerciseListOptions(user?._id, { page: 1, limit: 100 }),
        enabled: !!workoutSession && !!user,
    });
    const exerciseLibrary = useMemo(() => musclesQuery.data?.exercises ?? [], [musclesQuery.data]);
    const isLoadingSession = !!sessionId && sessionQuery.isPending;
    const isLoadingMuscles = musclesQuery.isFetching;
    const sessionError = (sessionQuery.error ? friendlyError(sessionQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const muscleError = (musclesQuery.error ? friendlyError(musclesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    useEffect(() => {
        if (!sessionId) navigate("/");
    }, [sessionId, navigate]);

    const trainedMuscles = useMemo(() => {
        if (!workoutSession) {
            return {
                primaryMuscles: [] as string[],
                secondaryMuscles: [] as string[],
            };
        }

        const primaryMuscles = new Set<string>();
        const secondaryMuscles = new Set<string>();

        for (const sessionExercise of workoutSession.exercises) {
            const matchedExercise = exerciseLibrary.find((exercise) => {
                const matchesId =
                    sessionExercise.exerciseId &&
                    exercise._id === sessionExercise.exerciseId;

                const matchesName =
                    exercise.name.trim().toLowerCase() ===
                    sessionExercise.exerciseName.trim().toLowerCase();

                return matchesId || matchesName;
            });

            if (!matchedExercise) {
                continue;
            }

            for (const muscle of matchedExercise.primaryMuscles ?? []) {
                primaryMuscles.add(muscle);
            }

            for (const muscle of matchedExercise.secondaryMuscles ?? []) {
                secondaryMuscles.add(muscle);
            }
        }

        for (const muscle of primaryMuscles) {
            secondaryMuscles.delete(muscle);
        }

        return {
            primaryMuscles: [...primaryMuscles],
            secondaryMuscles: [...secondaryMuscles],
        };
    }, [workoutSession, exerciseLibrary]);

    if (isLoadingSession && !workoutSession) {
        return (
            <LoadingState
                layout="result"
                className={styles.page}
                title={t("WorkoutResultPage.workoutResult")}
                message={t("WorkoutResultPage.loadingYourSavedWorkout")}
                color="var(--color-success)"
            />
        );
    }

    if (!workoutSession) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <h1 className={styles.title}>{t("WorkoutResultPage.noWorkoutResultFound")}</h1>
                    <p className={styles.stateText}>
                        {sessionError || t("common.resultMissing")}
                    </p>

                    <div className={styles.actions}>
                        <Button onClick={() => navigate("/")}> {t("common.backToHome")} </Button>
                    </div>
                </Card>
            </Box>
        );
    }

    const totalExercises = workoutSession.exercises.length;

    const totalSets = workoutSession.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const completedDate = formatCompletedDate(workoutSession.endedAt);
    const endTime = formatEndTime(workoutSession.endedAt);

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>{t("WorkoutResultPage.workoutComplete")}</p>
                    <h1 className={styles.title}><motion.svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 8 }}><motion.path d="m5 12 4 4 10-10" initial={{ pathLength: completionTiming.duration === 0 ? 1 : 0 }} animate={{ pathLength: 1 }} transition={completionTiming} /></motion.svg>{t("WorkoutResultPage.workoutSaved")}</h1>
                    <p className={styles.subtitle}> {t("WorkoutResultPage.yourSessionIsInWorkoutHistory")} </p>
                </div>
            </div>

            <Card className={styles.summaryCard}>
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>{t("common.completed")}</span>
                        <span className={styles.summaryValue}>{completedDate}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>{t("common.endTime")}</span>
                        <span className={styles.summaryValue}>{endTime}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>{t("common.exercises")}</span>
                        <span className={styles.summaryValue}>{formatNumber(totalExercises)}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>{t("common.totalSets")}</span>
                        <span className={styles.summaryValue}>{formatNumber(totalSets)}</span>
                    </div>
                </div>
            </Card>

            <Card className={styles.muscleCard}>
                <div className={styles.muscleCardContent}>
                    <div className={styles.muscleInfo}>
                        <h2 className={styles.sectionTitle}>{t("common.musclesTrained")}</h2>

                        <p className={styles.sectionText}> {t("common.primaryAndSecondaryMusclesTargetedByYourExercises")} </p>

                        {isLoadingMuscles && exerciseLibrary.length === 0 && (
                            <LoadingState
                                layout="muscles"
                                variant="inline"
                                message={t("common.loadingMuscleProfile")}
                                color="var(--color-success)"
                            />
                        )}

                        {muscleError && (
                            <p className={styles.errorText} role="alert">{translateMessage(muscleError)}</p>
                        )}

                    </div>

                    <div className={styles.muscleDummyWrap}>
                        <MuscleDummy
                            variant="full"
                            primaryMuscles={trainedMuscles.primaryMuscles}
                            secondaryMuscles={trainedMuscles.secondaryMuscles}
                        />
                    </div>
                </div>
            </Card>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>{t("WorkoutResultPage.recordedSets")}</h2>
                        <p className={styles.sectionText}> {t("common.setsRepsAndWeightRecordedDuringThisWorkout")} </p>
                    </div>
                </div>

                {workoutSession.exercises.length === 0 && <Card className={styles.stateCard}><p className={styles.stateText}>{t("common.noSetsWereRecordedForThisSession")}</p></Card>}
                <div className={styles.exerciseList}>
                    {workoutSession.exercises.map((exercise, exerciseIndex) => (
                        <Card
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            className={styles.exerciseCard}
                        >
                            <div className={styles.exerciseHeader}>
                                <div>
                                    <p className={styles.exerciseNumber}> {t("common.exercise")} {exerciseIndex + 1}
                                    </p>

                                    <h3 className={styles.exerciseTitle}>
                                        {exercise.exerciseName}
                                    </h3>
                                </div>

                                <span className={styles.setCount}>
                                    {t("common.setCount", { count: exercise.sets.length })}
                                </span>
                            </div>

                            <div className={styles.setsList}>
                                {exercise.training && exercise.training.format !== "strength" && <p>{t("common.planned")} {formatTrainingSeconds(trainingTotalSeconds(exercise.training))} {t("common.actual")} {formatTrainingSeconds(exercise.cardioCompletion?.elapsedSeconds ?? 0)}{exercise.training.format === "intervals" ? t("common.valueOfValueRounds", { value0: exercise.cardioCompletion?.completedRounds ?? 0, value1: exercise.training.rounds }) : ""}{exercise.cardioCompletion?.manual ? t("common.completedManually") : ""}</p>}
                                {exercise.sets.map((set, index) => (
                                    <div key={index} className={styles.setRow}>
                                        <span className={styles.setIndex}> {t("common.set")} {index + 1}
                                        </span>

                                        <span className={styles.setValue}>
                                            {formatNumber(set.weight)} {t("common.kg")} </span>

                                        <span className={styles.setValue}>
                                            {formatNumber(set.reps)} {t("common.reps")} </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <div className={styles.actions}>
                <Button variant="secondary" onClick={() => navigate("/")}> {t("common.backToHome")} </Button>

                <Button onClick={() => navigate("/workout-select")}> {t("WorkoutResultPage.startAnotherWorkout")} </Button>
            </div>
        </Box>
    );
}
