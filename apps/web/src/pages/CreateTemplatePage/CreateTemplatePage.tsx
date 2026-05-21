
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import { getExerciseLibraryRequest } from "../../services/exerciseApi";
import {
    createWorkoutTemplateRequest,
} from "../../services/workoutTemplateApi";

import type { WorkoutTemplateSet } from "@workout-app/shared";
import type { Exercise } from "@workout-app/shared";

import styles from "./CreateTemplatePage.module.css";

type SelectedTemplateExercise = {
    exerciseId: string;
    exerciseName: string;
    plannedSets: PlannedSetForm[];
};

type PlannedSetForm = {
    reps: string;
    weight: string;
    restSeconds: string;
    notes: string;
};


function createEmptySet(): PlannedSetForm {
    return {
        reps: "",
        weight: "",
        restSeconds: "",
        notes: "",
    };
}

function parseNullableNumber(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const parsedValue = Number(trimmedValue);

    if (Number.isNaN(parsedValue)) {
        return null;
    }

    return parsedValue;
}


export default function CreateTemplatePage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");


    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<
        SelectedTemplateExercise[]
    >([]);

    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [exerciseError, setExerciseError] = useState("");
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    useEffect(() => {
        async function loadExercises() {
            setExerciseError("");
            setIsLoadingExercises(true);

            try {
                const data = await getExerciseLibraryRequest({
                    page: 1,
                    limit: 100,
                    search: debouncedSearchTerm,
                });

                setAvailableExercises(data.exercises);
            } catch (error) {
                if (error instanceof Error) {
                    setExerciseError(error.message);
                } else {
                    setExerciseError("Failed to load exercises");
                }
            } finally {
                setIsLoadingExercises(false);
            }
        }

        loadExercises();
    }, [debouncedSearchTerm]);

    const selectedExerciseIds = useMemo(() => {
        return new Set(
            selectedExercises.map((selectedExercise) => selectedExercise.exerciseId),
        );
    }, [selectedExercises]);

    function handleAddExercise(exercise: Exercise) {
        if (selectedExerciseIds.has(exercise._id)) {
            return;
        }

        setSelectedExercises((currentExercises) => [
            ...currentExercises,
            {
                exerciseId: exercise._id,
                exerciseName: exercise.name,
                plannedSets: [createEmptySet()],
            },
        ]);
    }

    function handleRemoveExercise(exerciseId: string) {
        setSelectedExercises((currentExercises) =>
            currentExercises.filter((exercise) => exercise.exerciseId !== exerciseId),
        );
    }

    function handleMoveExercise(exerciseId: string, direction: "up" | "down") {
        setSelectedExercises((currentExercises) => {
            const currentIndex = currentExercises.findIndex(
                (exercise) => exercise.exerciseId === exerciseId,
            );

            if (currentIndex === -1) {
                return currentExercises;
            }

            const nextIndex =
                direction === "up" ? currentIndex - 1 : currentIndex + 1;

            if (nextIndex < 0 || nextIndex >= currentExercises.length) {
                return currentExercises;
            }

            const copiedExercises = [...currentExercises];
            const currentExercise = copiedExercises[currentIndex];

            copiedExercises[currentIndex] = copiedExercises[nextIndex];
            copiedExercises[nextIndex] = currentExercise;

            return copiedExercises;
        });
    }

    function handleAddSet(exerciseId: string) {
        setSelectedExercises((currentExercises) =>
            currentExercises.map((exercise) => {
                if (exercise.exerciseId !== exerciseId) {
                    return exercise;
                }

                return {
                    ...exercise,
                    plannedSets: [...exercise.plannedSets, createEmptySet()],
                };
            }),
        );
    }

    function handleRemoveSet(exerciseId: string, setIndex: number) {
        setSelectedExercises((currentExercises) =>
            currentExercises.map((exercise) => {
                if (exercise.exerciseId !== exerciseId) {
                    return exercise;
                }

                return {
                    ...exercise,
                    plannedSets: exercise.plannedSets.filter(
                        (_set, index) => index !== setIndex,
                    ),
                };
            }),
        );
    }

    function handleUpdateSet(
        exerciseId: string,
        setIndex: number,
        field: keyof PlannedSetForm,
        value: string,
    ) {
        setSelectedExercises((currentExercises) =>
            currentExercises.map((exercise) => {
                if (exercise.exerciseId !== exerciseId) {
                    return exercise;
                }

                return {
                    ...exercise,
                    plannedSets: exercise.plannedSets.map((set, index) => {
                        if (index !== setIndex) {
                            return set;
                        }

                        return {
                            ...set,
                            [field]: value,
                        };
                    }),
                };
            }),
        );
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitError("");

        if (!name.trim()) {
            setSubmitError("Template name is required.");
            return;
        }

        if (selectedExercises.length === 0) {
            setSubmitError("Add at least one exercise to the template.");
            return;
        }

        setIsSaving(true);

        try {
            const exercises = selectedExercises.map((exercise) => {
                const plannedSets: WorkoutTemplateSet[] = exercise.plannedSets.map(
                    (set) => ({
                        reps: parseNullableNumber(set.reps),
                        weight: parseNullableNumber(set.weight),
                        restSeconds: parseNullableNumber(set.restSeconds),
                        notes: set.notes.trim(),
                    }),
                );

                return {
                    exerciseId: exercise.exerciseId,
                    plannedSets,
                };
            });

            await createWorkoutTemplateRequest({
                name: name.trim(),
                description: description.trim() || undefined,
                exercises,
            });

            navigate("/templates/my");
        } catch (error) {
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError("Failed to create template");
            }
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Box className={styles.page}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <header className={styles.header}>
                    <div>
                        <p className={styles.kicker}>Create template</p>
                        <h1 className={styles.title}>New workout template</h1>
                        <p className={styles.subtitle}>
                            Build a reusable workout plan that you can start later.
                        </p>
                    </div>

                    <div className={styles.headerActions}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate("/templates/my")}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save template"}
                        </Button>
                    </div>
                </header>

                {submitError && (
                    <Card className={styles.errorCard}>
                        <p>{submitError}</p>
                    </Card>
                )}

                <Card className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Template details</h2>

                    <div className={styles.fieldGrid}>
                        <label className={styles.field}>
                            <span>Name *</span>
                            <input
                                type="text"
                                value={name}
                                placeholder="Example: My Push Day"
                                onChange={(event) => setName(event.target.value)}
                            />
                        </label>


                    </div>

                    <label className={styles.field}>
                        <span>Description</span>
                        <textarea
                            value={description}
                            placeholder="Short description of this template"
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </label>
                </Card>

                <div className={styles.builderGrid}>
                    <Card className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2 className={styles.sectionTitle}>
                                    Exercise library
                                </h2>
                                <p className={styles.sectionText}>
                                    Search and add exercises to your template.
                                </p>
                            </div>
                        </div>

                        <input
                            className={styles.searchInput}
                            type="text"
                            value={searchTerm}
                            placeholder="Search exercises..."
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />

                        {isLoadingExercises && (
                            <p className={styles.stateText}>Loading exercises...</p>
                        )}

                        {exerciseError && (
                            <p className={styles.errorText}>{exerciseError}</p>
                        )}

                        <div className={styles.exerciseList}>
                            {availableExercises.map((exercise) => {
                                const isSelected = selectedExerciseIds.has(
                                    exercise._id,
                                );

                                return (
                                    <div
                                        key={exercise._id}
                                        className={styles.exerciseOption}
                                    >
                                        <div>
                                            <h3>{exercise.name}</h3>

                                            <p>
                                                {exercise.primaryMuscles?.join(", ") ||
                                                    "No muscles"}
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isSelected}
                                            onClick={() => handleAddExercise(exercise)}
                                        >
                                            {isSelected ? "Added" : "Add"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2 className={styles.sectionTitle}>
                                    Template exercises
                                </h2>
                                <p className={styles.sectionText}>
                                    Reorder exercises and add planned sets.
                                </p>
                            </div>
                        </div>

                        {selectedExercises.length === 0 ? (
                            <p className={styles.stateText}>
                                No exercises added yet.
                            </p>
                        ) : (
                            <div className={styles.selectedList}>
                                {selectedExercises.map((exercise, exerciseIndex) => (
                                    <div
                                        key={exercise.exerciseId}
                                        className={styles.selectedExercise}
                                    >
                                        <div className={styles.selectedHeader}>
                                            <div>
                                                <p className={styles.exerciseOrder}>
                                                    Exercise {exerciseIndex + 1}
                                                </p>

                                                <h3>{exercise.exerciseName}</h3>
                                            </div>

                                            <div className={styles.smallActions}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    disabled={exerciseIndex === 0}
                                                    onClick={() =>
                                                        handleMoveExercise(
                                                            exercise.exerciseId,
                                                            "up",
                                                        )
                                                    }
                                                >
                                                    Up
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    disabled={
                                                        exerciseIndex ===
                                                        selectedExercises.length - 1
                                                    }
                                                    onClick={() =>
                                                        handleMoveExercise(
                                                            exercise.exerciseId,
                                                            "down",
                                                        )
                                                    }
                                                >
                                                    Down
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    onClick={() =>
                                                        handleRemoveExercise(
                                                            exercise.exerciseId,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>

                                        <div className={styles.setList}>
                                            {exercise.plannedSets.map(
                                                (set, setIndex) => (
                                                    <div
                                                        key={setIndex}
                                                        className={styles.setRow}
                                                    >
                                                        <span>
                                                            Set {setIndex + 1}
                                                        </span>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Reps"
                                                            value={set.reps}
                                                            onChange={(event) =>
                                                                handleUpdateSet(
                                                                    exercise.exerciseId,
                                                                    setIndex,
                                                                    "reps",
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Weight"
                                                            value={set.weight}
                                                            onChange={(event) =>
                                                                handleUpdateSet(
                                                                    exercise.exerciseId,
                                                                    setIndex,
                                                                    "weight",
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Rest sec"
                                                            value={set.restSeconds}
                                                            onChange={(event) =>
                                                                handleUpdateSet(
                                                                    exercise.exerciseId,
                                                                    setIndex,
                                                                    "restSeconds",
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        <input
                                                            type="text"
                                                            placeholder="Notes"
                                                            value={set.notes}
                                                            onChange={(event) =>
                                                                handleUpdateSet(
                                                                    exercise.exerciseId,
                                                                    setIndex,
                                                                    "notes",
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleRemoveSet(
                                                                    exercise.exerciseId,
                                                                    setIndex,
                                                                )
                                                            }
                                                        >
                                                            Remove set
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                handleAddSet(exercise.exerciseId)
                                            }
                                        >
                                            Add set
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </form>
        </Box>
    );
}