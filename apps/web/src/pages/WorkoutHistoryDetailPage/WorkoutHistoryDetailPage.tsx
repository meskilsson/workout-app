import WorkoutMarker from "../../components/training/WorkoutMarker";
import ExerciseName from "../../components/exercises/ExerciseName";
import { formatNumber, translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { cardRest, cardHover } from "../../components/motion/presets";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { exerciseListOptions, sessionDetailOptions } from "../../query/resourceQueries";
import { useRepeatSessionMutation } from "../../query/useSessionMutations";
import { useLocation, useNavigate, useParams } from "../../routes/navigationHooks";

import formatDuration from "../../utils/formatDuration";
import { formatCompletedDate } from "../../utils/formatCompletedDate";
import { formatEndTime } from "../../utils/formatEndTime";

import { formatTrainingSeconds, trainingTotalSeconds } from "@workout-app/shared";
import type { WorkoutSession } from "@workout-app/shared";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import styles from "./WorkoutHistoryDetailPage.module.css";

type LocationState = {
    workoutSession?: WorkoutSession;
};

export default function WorkoutHistoryDetailPage() {
    useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const state = location.state as LocationState | null;

    const { user } = useAuth();
    const sessionQuery = useQuery({
        ...sessionDetailOptions(user?._id ?? "", id ?? ""),
        initialData: state?.workoutSession && state.workoutSession._id === id && state.workoutSession.userId === user?._id
            ? state.workoutSession : undefined,
    });
    const session = sessionQuery.data;
    const musclesQuery = useQuery({
        ...exerciseListOptions(user?._id, { page: 1, limit: 100 }),
        enabled: !!session && !!user,
    });
    const exerciseLibrary = useMemo(() => musclesQuery.data?.exercises ?? [], [musclesQuery.data]);
    const isLoading = !!id && sessionQuery.isPending;
    const isLoadingMuscles = musclesQuery.isFetching;
    const error = !id ? t("common.workoutSessionIdIsMissing") : (sessionQuery.error ? friendlyError(sessionQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const muscleError = (musclesQuery.error ? friendlyError(musclesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const [actionError, setActionError] = useState("");
    const repeatMutation = useRepeatSessionMutation();
    const isRepeatingWorkout = repeatMutation.isPending;

    async function handleTrainAgain() {
        if (!session?._id) {
            setActionError(t("common.workoutSessionIdIsMissing"));
            return;
        }

        setActionError("");

        try {
            const draft = await repeatMutation.mutateAsync(session._id);
            navigate(`/workout/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setActionError(friendlyError(error));
            } else {
                setActionError(t("common.failedToPrepareWorkout"));
            }
        }
    }

    const trainedMuscles = useMemo(() => {
        if (!session) {
            return {
                primaryMuscles: [] as string[],
                secondaryMuscles: [] as string[],
            };
        }

        const primaryMuscles = new Set<string>();
        const secondaryMuscles = new Set<string>();

        for (const sessionExercise of session.exercises) {
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
    }, [session, exerciseLibrary]);

    if (isLoading && !session) {
        return (
            <LoadingState
                layout="sessionDetails"
                className={styles.page}
                title={t("common.workoutHistory")}
                message={t("common.loadingWorkoutDetails")}
            />
        );
    }

    if (!session) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <h1 className={styles.title}>{t("common.workoutDetails")}</h1>

                    <p className={styles.errorText}>
                        {error || t("common.sessionMissing")}
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/profile/workouts")}
                    > {t("common.backToHistory")} </Button>
                </Card>
            </Box>
        );
    }

    const totalSets = session.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const totalExercises = session.exercises.length;
    const completedDate = formatCompletedDate(session.endedAt);
    const endTime = formatEndTime(session.endedAt);
    const duration = formatDuration(session.startedAt, session.endedAt);

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>

                    <h1 className={styles.title}>{t("common.workoutDetails")}</h1>

                    <p className={styles.subtitle}> {t("WorkoutHistoryDetailPage.yourRecordedSetsWeightRepsAndDuration")} </p>
                </div>

                <div className={styles.headerActions}>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleTrainAgain}
                        disabled={isRepeatingWorkout}
                    >
                        {isRepeatingWorkout ? (
                            <LoadingPredator
                                size="small"
                                color="currentColor"
                                label={t("common.preparing")}
                                showLabel
                            />
                        ) : (
                            t("common.trainAgain")
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/profile/workouts")}
                    > {t("common.backToHistory")} </Button>
                </div>
            </div>

            {actionError && (
                <Card className={styles.actionErrorCard}>
                    <p className={styles.errorText} role="alert">{translateMessage(actionError)}</p>
                </Card>
            )}

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

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>{t("WorkoutHistoryDetailPage.duration")}</span>
                        <span className={styles.summaryValue}>{duration}</span>
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
                        <h2 className={styles.sectionTitle}>{t("common.exercises")}</h2>

                        <p className={styles.sectionText}> {t("common.setsRepsAndWeightRecordedDuringThisWorkout")} </p>
                    </div>
                </div>

                {session.exercises.length === 0 && <Card className={styles.stateCard}><p className={styles.stateText}>{t("common.noSetsWereRecordedForThisSession")}</p></Card>}
                <div className={styles.exerciseList}>
                    {session.exercises.map((exercise, exerciseIndex) => (
                        <Card
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            animate={cardRest} whileHover={cardHover} className={styles.exerciseCard}
                        >
                            <div className={styles.exerciseHeader}>
                                <div>
                                    <p className={styles.exerciseNumber}> {t("common.exercise")} {exerciseIndex + 1}
                                    </p>

                                    <h3 className={styles.exerciseTitle}>
                                        <ExerciseName id={exercise.exerciseId} name={exercise.exerciseName} /> {exercise.supersetId && <WorkoutMarker kind="superset" />}
                                    </h3>
                                </div>

                                <span className={styles.setCount}>
                                    {t("common.setCount", { count: exercise.sets.length })}
                                </span>
                            </div>

                            <div className={styles.setsList}>
                                {exercise.training && exercise.training.format !== "strength" && <p>{t("common.planned")} {formatTrainingSeconds(trainingTotalSeconds(exercise.training))} {t("common.actual")} {formatTrainingSeconds(exercise.cardioCompletion?.elapsedSeconds ?? 0)}{exercise.training.format === "intervals" ? t("common.valueOfValueRounds", { value0: exercise.cardioCompletion?.completedRounds ?? 0, value1: exercise.training.rounds }) : ""}{exercise.cardioCompletion?.manual ? t("common.completedManually") : ""}</p>}
                                {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className={styles.setRow}>
                                        <span className={styles.setIndex}> {t("common.set")} {setIndex + 1} {set.isWarmup && <WorkoutMarker kind="warmup" />}
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
        </Box>
    );
}
