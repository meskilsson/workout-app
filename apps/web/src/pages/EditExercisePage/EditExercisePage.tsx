import { Check } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { exerciseDetailOptions } from "../../query/resourceQueries";
import { useUpdateExerciseMutation } from "../../query/useExerciseMutations";
import { useNavigate, useParams } from "../../routes/navigationHooks";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import {
    DIFFICULTY_OPTIONS,
    EQUIPMENT_OPTIONS,
    EXERCISE_TYPE_OPTIONS,
    MUSCLE_OPTIONS,
    type Difficulty,
    type Equipment,
    type ExerciseType,
    type Muscle,
    type Exercise,
} from "@workout-app/shared";

import styles from './EditExercisePage.module.css';

function isMuscle(value: string): value is Muscle {
    return MUSCLE_OPTIONS.includes(value as Muscle);
}

function normalizeMuscles(muscles: string[] | undefined): Muscle[] {
    return (muscles ?? []).filter(isMuscle);
}

function isExerciseType(value: string | undefined): value is ExerciseType {
    return !!value && EXERCISE_TYPE_OPTIONS.includes(value as ExerciseType);
}

function isEquipment(value: string | undefined): value is Equipment {
    return !!value && EQUIPMENT_OPTIONS.includes(value as Equipment);
}

function isDifficulty(value: string | undefined): value is Difficulty {
    return !!value && DIFFICULTY_OPTIONS.includes(value as Difficulty);
}



export default function EditExercisePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const exerciseQuery = useQuery(exerciseDetailOptions(user?._id, id ?? ""));
    if (id && exerciseQuery.isPending) {
        return <LoadingState layout="form" className={styles.page} title="Edit exercise" message="Loading exercise..." />;
    }
    if (!exerciseQuery.data) {
        return <Box className={styles.page}><Card className={styles.card}>
            <p className={styles.errorText} role="alert">{exerciseQuery.error?.message || "Exercise not found."}</p>
            <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
        </Card></Box>;
    }
    return <EditExerciseForm key={user?._id + ":" + id} exercise={exerciseQuery.data} />;
}

function EditExerciseForm({ exercise }: { exercise: Exercise }) {
    const navigate = useNavigate();
    const id = exercise._id;
    const [name, setName] = useState(exercise.name ?? "");
    const [description, setDescription] = useState(exercise.description ?? "");
    const [instructions, setInstructions] = useState(exercise.instructions ?? "");
    const [exerciseType, setExerciseType] = useState<ExerciseType | "">(
        isExerciseType(exercise.exerciseType) ? exercise.exerciseType : "",
    );
    const [primaryMuscles, setPrimaryMuscles] = useState<Muscle[]>(() => normalizeMuscles(exercise.primaryMuscles));
    const [secondaryMuscles, setSecondaryMuscles] = useState<Muscle[]>(() => normalizeMuscles(exercise.secondaryMuscles));
    const [equipment, setEquipment] = useState<Equipment | "">(isEquipment(exercise.equipment) ? exercise.equipment : "");
    const [difficulty, setDifficulty] = useState<Difficulty | "">(isDifficulty(exercise.difficulty) ? exercise.difficulty : "");
    const [imageUrl] = useState(exercise.imageUrl ?? "");
    const [error, setError] = useState("");
    const updateMutation = useUpdateExerciseMutation();
    const isSaving = updateMutation.isPending;

    function toggleMuscle(
        muscle: Muscle,
        setSelected: React.Dispatch<React.SetStateAction<Muscle[]>>,
    ) {
        setSelected((prev) =>
            prev.includes(muscle)
                ? prev.filter((item) => item !== muscle)
                : [...prev, muscle],
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (isSaving) return;

        if (!id) {
            setError("Exercise id is missing.");
            return;
        }

        setError("");

        try {
            await updateMutation.mutateAsync({ id, data: {
                name,
                description: description || undefined,
                instructions: instructions || undefined,
                exerciseType: exerciseType || undefined,
                primaryMuscles,
                secondaryMuscles,
                equipment: equipment || undefined,
                difficulty: difficulty || undefined,
                imageUrl,
            } });

            navigate("/profile");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update exercise");
            }
        }
    }

    return (
        <Box className={styles.page}>
            <Card variant="default" className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Edit exercise</h1>
                    <p className={styles.subtitle}>
                        Update your custom exercise details.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="name">Name *</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="e.g. Cable Chest Fly"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="description">Description</label>
                        <input
                            id="description"
                            type="text"
                            placeholder="Short description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="instructions">Instructions</label>
                        <textarea
                            id="instructions"
                            placeholder="How to perform the exercise"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="exerciseType">Exercise type</label>
                            <select
                                id="exerciseType"
                                value={exerciseType}
                                onChange={(e) =>
                                    setExerciseType((e.target.value as ExerciseType | "") || "")
                                }
                            >
                                <option value="">Select type</option>
                                {EXERCISE_TYPE_OPTIONS.map((type) => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="difficulty">Difficulty</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) =>
                                    setDifficulty((e.target.value as Difficulty | "") || "")
                                }
                            >
                                <option value="">Select difficulty</option>
                                {DIFFICULTY_OPTIONS.map((level) => (
                                    <option key={level} value={level}>
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="equipment">Equipment</label>
                        <select
                            id="equipment"
                            value={equipment}
                            onChange={(e) =>
                                setEquipment((e.target.value as Equipment | "") || "")
                            }
                        >
                            <option value="">Select equipment</option>
                            {EQUIPMENT_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item.charAt(0).toUpperCase() + item.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <span id="primary-muscles-label">Primary muscles</span>
                        <div className={styles.checkboxGrid} role="group" aria-labelledby="primary-muscles-label">
                            {MUSCLE_OPTIONS.map((muscle) => (
                                <label key={muscle} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={primaryMuscles.includes(muscle)}
                                        onChange={() => toggleMuscle(muscle, setPrimaryMuscles)}
                                    />
                                    <span>{muscle}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <span id="secondary-muscles-label">Secondary muscles</span>
                        <div className={styles.checkboxGrid} role="group" aria-labelledby="secondary-muscles-label">
                            {MUSCLE_OPTIONS.map((muscle) => (
                                <label key={muscle} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={secondaryMuscles.includes(muscle)}
                                        onChange={() => toggleMuscle(muscle, setSecondaryMuscles)}
                                    />
                                    <span>{muscle}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <p className={styles.error} role="alert">{error}</p>}

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate("/profile")}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>

                        <Button icon={Check} type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label="Saving..."
                                    showLabel
                                />
                            ) : (
                                "Save changes"
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </Box>
    );
}
