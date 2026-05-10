import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Modal from "../../components/ui/modal/Modal";
import Button from "../../components/ui/button/Button";
import WorkoutDurationTimer from "../../components/timer/WorkoutDurationTimer";

import {
    completeWorkoutDraftRequest,
    getWorkoutDraftByIdRequest,
    updateWorkoutDraftSetsRequest,
} from "../../services/workoutDraftApi";

import { useWorkoutTimer } from "@workout-app/shared/timer";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";

import styles from "./WorkoutPage.module.css";

type SelectedExercise = {
    _id: string;
    name: string;
};

type WorkoutSet = {
    weight: string;
    reps: string;
};

type DraftSet = {
    weight: number | null;
    reps: number | null;
};

type DraftExercise = {
    exerciseId: string;
    exerciseName: string;
    sets: DraftSet[];
};

type WorkoutDraft = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    selectedMuscleGroups: string[];
    exercises: DraftExercise[];
    startedAt?: string | null;
    completedSessionId?: string | null;
};

function draftSetToInputSet(set: DraftSet): WorkoutSet {
    return {
        weight: set.weight === null ? "" : String(set.weight),
        reps: set.reps === null ? "" : String(set.reps),
    };
}

function hasCompletedSet(sets: WorkoutSet[]) {
    return sets.some((set) => set.weight !== "" && set.reps !== "");
}

export default function WorkoutPage() {
    const { draftId } = useParams();
    const navigate = useNavigate();

    const { start: startWorkoutTimer, state: workoutTimerState } =
        useWorkoutTimer();
    const { start: startRestTimer } = useRestTimerControls();

    const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(
        [],
    );
    const [setsByExercise, setSetsByExercise] = useState<
        Record<string, WorkoutSet[]>
    >({});

    const [isLoadingDraft, setIsLoadingDraft] = useState(true);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [hasUserEditedSets, setHasUserEditedSets] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadDraft() {
            if (!draftId) {
                navigate("/workout-select");
                return;
            }

            try {
                setError("");
                setIsLoadingDraft(true);

                const draft: WorkoutDraft = await getWorkoutDraftByIdRequest(draftId);

                if (draft.status === "building") {
                    navigate(`/workout-summary/${draftId}`);
                    return;
                }

                if (draft.status === "completed" && draft.completedSessionId) {
                    navigate(`/workout-result/${draft.completedSessionId}`);
                    return;
                }

                if (draft.status === "abandoned") {
                    setError("This workout draft has been abandoned.");
                    return;
                }

                const exercises = draft.exercises.map((exercise) => ({
                    _id: exercise.exerciseId,
                    name: exercise.exerciseName,
                }));

                const initialSetsByExercise = draft.exercises.reduce<
                    Record<string, WorkoutSet[]>
                >((acc, exercise) => {
                    acc[exercise.exerciseId] =
                        exercise.sets.length > 0
                            ? exercise.sets.map(draftSetToInputSet)
                            : [{ weight: "", reps: "" }];

                    return acc;
                }, {});

                setSelectedExercises(exercises);
                setSetsByExercise(initialSetsByExercise);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load workout draft.",
                );
            } finally {
                setIsLoadingDraft(false);
            }
        }

        loadDraft();
    }, [draftId, navigate]);

    useEffect(() => {
        if (
            selectedExercises.length > 0 &&
            !workoutTimerState.isRunning &&
            workoutTimerState.elapsedTime === 0
        ) {
            startWorkoutTimer();
        }
    }, [
        selectedExercises.length,
        workoutTimerState.isRunning,
        workoutTimerState.elapsedTime,
        startWorkoutTimer,
    ]);

    useEffect(() => {
        if (!draftId || !hasUserEditedSets || selectedExercises.length === 0) {
            return;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                setIsSavingDraft(true);

                await Promise.all(
                    selectedExercises.map((exercise) =>
                        updateWorkoutDraftSetsRequest(draftId, {
                            exerciseId: exercise._id,
                            sets: setsByExercise[exercise._id] ?? [],
                        }),
                    ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to save workout progress.",
                );
            } finally {
                setIsSavingDraft(false);
            }
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [draftId, hasUserEditedSets, selectedExercises, setsByExercise]);

    async function saveExerciseSets(exerciseId: string) {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            await updateWorkoutDraftSetsRequest(draftId, {
                exerciseId,
                sets: setsByExercise[exerciseId] ?? [],
            });
        } finally {
            setIsSavingDraft(false);
        }
    }

    async function saveAllExerciseSets() {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            await Promise.all(
                selectedExercises.map((exercise) =>
                    updateWorkoutDraftSetsRequest(draftId, {
                        exerciseId: exercise._id,
                        sets: setsByExercise[exercise._id] ?? [],
                    }),
                ),
            );
        } finally {
            setIsSavingDraft(false);
        }
    }

    function handleAddSet(exerciseId: string) {
        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "" }],
        }));
    }

    function handleSetChange(
        exerciseId: string,
        index: number,
        field: "weight" | "reps",
        value: string,
    ) {
        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).map((set, i) =>
                i === index ? { ...set, [field]: value } : set,
            ),
        }));
    }

    function handleRemoveSet(exerciseId: string, index: number) {
        const currentSets = setsByExercise[exerciseId] ?? [];

        if (currentSets.length <= 1) {
            return;
        }

        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: currentSets.filter((_, i) => i !== index),
        }));
    }

    async function handleCompleteSet(exerciseId: string, index: number) {
        const set = setsByExercise[exerciseId]?.[index];

        if (!set || set.weight === "" || set.reps === "") {
            setError("Add weight and reps before completing the set.");
            return;
        }

        try {
            setError("");
            await saveExerciseSets(exerciseId);
            startRestTimer();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save completed set.",
            );
        }
    }

    function handleEndSession() {
        setError("");
        setOpenModal(true);
    }

    function handleCloseModal() {
        if (!isSaving) {
            setOpenModal(false);
        }
    }

    async function handleConfirmEndWorkout() {
        if (!draftId) {
            navigate("/workout-select");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            const incompleteExercise = selectedExercises.find(
                (exercise) => !hasCompletedSet(setsByExercise[exercise._id] ?? []),
            );

            if (incompleteExercise) {
                setError(
                    `Add at least one completed set for ${incompleteExercise.name}.`,
                );
                setIsSaving(false);
                return;
            }

            await saveAllExerciseSets();

            const savedWorkoutSession = await completeWorkoutDraftRequest(draftId);

            setOpenModal(false);

            navigate(`/workout-result/${savedWorkoutSession._id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save workout session.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoadingDraft) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <p className={styles.errorText}>Loading workout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <WorkoutDurationTimer />

                <div className={styles.exerciseList}>
                    {selectedExercises.map((exercise) => {
                        const exerciseSets = setsByExercise[exercise._id] ?? [];

                        return (
                            <section className={styles.exerciseCard} key={exercise._id}>
                                <div className={styles.exerciseHeader}>
                                    <h2 className={styles.exerciseName}>{exercise.name}</h2>

                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="small"
                                        className={styles.addSetButton}
                                        onClick={() => handleAddSet(exercise._id)}
                                    >
                                        Add set
                                    </Button>
                                </div>

                                <div className={styles.setsList}>
                                    {exerciseSets.map((set, index) => (
                                        <div key={index} className={styles.setRow}>
                                            <div className={styles.inputGroup}>
                                                {index === 0 && (
                                                    <label className={styles.inputLabel}>
                                                        Weight
                                                    </label>
                                                )}

                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={set.weight}
                                                    className={styles.underlineInput}
                                                    onChange={(event) =>
                                                        handleSetChange(
                                                            exercise._id,
                                                            index,
                                                            "weight",
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                {index === 0 && (
                                                    <label className={styles.inputLabel}>
                                                        Reps
                                                    </label>
                                                )}

                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={set.reps}
                                                    className={styles.underlineInput}
                                                    onChange={(event) =>
                                                        handleSetChange(
                                                            exercise._id,
                                                            index,
                                                            "reps",
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="small"
                                                className={styles.completeSetButton}
                                                onClick={() =>
                                                    handleCompleteSet(exercise._id, index)
                                                }
                                                aria-label="Complete set and start rest timer"
                                            >
                                                ✓
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="small"
                                                className={styles.deleteButton}
                                                onClick={() =>
                                                    handleRemoveSet(exercise._id, index)
                                                }
                                                aria-label="Remove set"
                                            >
                                                X
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {error && (
                    <div className={styles.errorWrapper}>
                        <p className={styles.errorText}>{error}</p>
                    </div>
                )}

                <div className={styles.endSessionWrapper}>
                    <Button
                        type="button"
                        variant="danger"
                        size="medium"
                        className={styles.endSessionButton}
                        onClick={handleEndSession}
                        disabled={selectedExercises.length === 0}
                    >
                        End Session
                    </Button>
                </div>

                <Modal
                    title="End session?"
                    isOpen={openModal}
                    onClose={handleCloseModal}
                    actions={
                        <div className={styles.modalActions}>
                            <Button
                                type="button"
                                variant="danger"
                                size="medium"
                                className={styles.modalPrimaryButton}
                                onClick={handleConfirmEndWorkout}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "End Workout"}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={styles.modalSecondaryButton}
                                onClick={handleCloseModal}
                                disabled={isSaving}
                            >
                                Close
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}>
                        Are you sure you want to end this workout session?
                    </p>
                </Modal>
            </div>
        </div>
    );
}