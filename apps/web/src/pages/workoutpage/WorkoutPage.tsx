import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Modal from "../../components/ui/modal/Modal";
import Button from "../../components/ui/button/Button";
import { createWorkoutSessionRequest } from "../../services/workoutSessionApi";
import styles from "./WorkoutPage.module.css";
import WorkoutDurationTimer from "../../components/timer/WorkoutDurationTimer";
import { useWorkoutTimer } from "@workout-app/shared/timer";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";

type SelectedExercise = {
    _id: string;
    name: string;
};

type LocationState = {
    selectedExercises: SelectedExercise[];
    startedAt?: string;
};

type WorkoutSet = {
    weight: string;
    reps: string;
};

const EMPTY_EXERCISES: SelectedExercise[] = [];

export default function WorkoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const { start: startWorkoutTimer, state: workoutTimerState } = useWorkoutTimer();
    const { start: startRestTimer } = useRestTimerControls();

    const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({});
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const selectedExercises = state?.selectedExercises ?? EMPTY_EXERCISES;

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
        setSetsByExercise((prev) => {
            const next = { ...prev };

            selectedExercises.forEach((exercise) => {
                if (!next[exercise._id] || next[exercise._id].length === 0) {
                    next[exercise._id] = [{ weight: "", reps: "" }];
                }
            });

            Object.keys(next).forEach((exerciseId) => {
                const stillSelected = selectedExercises.some(
                    (exercise) => exercise._id === exerciseId,
                );

                if (!stillSelected) {
                    delete next[exerciseId];
                }
            });

            return next;
        });
    }, [selectedExercises]);

    function handleAddSet(exerciseId: string) {
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
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).map((set, i) =>
                i === index ? { ...set, [field]: value } : set,
            ),
        }));
    }

    function handleRemoveSet(exerciseId: string, index: number) {
        setSetsByExercise((prev) => {
            const currentSets = prev[exerciseId] ?? [];

            if (currentSets.length <= 1) {
                return prev;
            }

            return {
                ...prev,
                [exerciseId]: currentSets.filter((_, i) => i !== index),
            };
        });
    }

    function handleCompleteSet(exerciseId: string, index: number) {
        const set = setsByExercise[exerciseId]?.[index];

        if (!set || set.weight === "" || set.reps === "") {
            setError("Add weight and reps before completing the set.");
            return;
        }

        setError("");
        startRestTimer();
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
        setError("");
        setIsSaving(true);

        try {
            const payload = {
                exercises: selectedExercises
                    .map((exercise) => ({
                        exerciseId: exercise._id,
                        exerciseName: exercise.name,
                        sets: (setsByExercise[exercise._id] ?? []).filter(
                            (set) => set.weight !== "" && set.reps !== "",
                        ),
                    }))
                    .filter((exercise) => exercise.sets.length > 0),
                startedAt: workoutTimerState.startTime
                    ? new Date(workoutTimerState.startTime).toISOString()
                    : undefined,
                endedAt: new Date().toISOString(),
            };

            if (payload.exercises.length === 0) {
                setError("Add at least one completed set before ending the workout.");
                setIsSaving(false);
                return;
            }

            const savedWorkoutSession = await createWorkoutSessionRequest(payload);

            setOpenModal(false);

            navigate("/workout-result", {
                state: { workoutSession: savedWorkoutSession },
            });
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to save workout session.");
            }
        } finally {
            setIsSaving(false);
        }
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
                                                    onChange={(e) =>
                                                        handleSetChange(
                                                            exercise._id,
                                                            index,
                                                            "weight",
                                                            e.target.value,
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
                                                    onChange={(e) =>
                                                        handleSetChange(
                                                            exercise._id,
                                                            index,
                                                            "reps",
                                                            e.target.value,
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