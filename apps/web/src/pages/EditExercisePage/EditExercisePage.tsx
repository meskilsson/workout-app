import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import {
    DIFFICULTY_OPTIONS,
    EQUIPMENT_OPTIONS,
    EXERCISE_TYPE_OPTIONS,
    MUSCLE_OPTIONS,
    type Difficulty,
    type Equipment,
    type ExerciseType,
    type Muscle,
} from "@workout-app/shared";

import { getExerciseByIdRequest, updateExerciseRequest } from "../../services/exerciseApi";

import styles from './EditExercisePage.module.css';

type ExerciseResponse = {
    _id: string;
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: ExerciseType;
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: Equipment;
    difficulty?: Difficulty;
    imageUrl?: string;
    isCustom: boolean;
}

export default function EditExercisePage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [exerciseType, setExerciseType] = useState<ExerciseType | "">("");
    const [primaryMuscles, setPrimaryMuscles] = useState<Muscle[]>([]);
    const [secondaryMuscles, setSecondaryMuscles] = useState<Muscle[]>([]);
    const [equipment, setEquipment] = useState<Equipment | "">("");
    const [difficulty, setDifficulty] = useState<Difficulty | "">("");
    const [imageUrl, setImageUrl] = useState("");

    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");


    useEffect(() => {

        if (!id) {
            setError("Exercise id is missing");
            setIsFetching(true)
            return;
        }

        const exerciseId = id;

        async function loadExercise() {
            setError("");
            setIsFetching(true);

            try {
                const exercise = (await getExerciseByIdRequest(
                    exerciseId,
                )) as ExerciseResponse;

                setName(exercise.name ?? "");
                setDescription(exercise.description ?? "");
                setInstructions(exercise.instructions ?? "");
                setExerciseType(exercise.exerciseType ?? "");
                setPrimaryMuscles(exercise.primaryMuscles ?? []);
                setSecondaryMuscles(exercise.secondaryMuscles ?? []);
                setEquipment(exercise.equipment ?? "");
                setDifficulty(exercise.difficulty ?? "");
                setImageUrl(exercise.imageUrl ?? "");
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load exercise")
                }
            } finally {
                setIsFetching(false);
            }
        }

        loadExercise();
    }, [id])

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

        if (!id) {
            setError("Exercise id is missing.");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            await updateExerciseRequest(id, {
                name,
                description: description || undefined,
                instructions: instructions || undefined,
                exerciseType: exerciseType || undefined,
                primaryMuscles,
                secondaryMuscles,
                equipment: equipment || undefined,
                difficulty: difficulty || undefined,
                imageUrl,
            });

            navigate("/profile");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update exercise");
            }
        } finally {
            setIsSaving(false);
        }
    }

    if (isFetching) {
        return (
            <Box className={styles.page}>
                <Card className={styles.card}>
                    <h1 className={styles.title}>Edit Exercise</h1>
                    <p className={styles.subtitle}>Loading exercise...</p>
                </Card>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <Card variant="default" className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Edit Exercise</h1>
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
                            <label htmlFor="exerciseType">Exercise Type</label>
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
                        <label>Primary Muscles</label>
                        <div className={styles.checkboxGrid}>
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
                        <label>Secondary Muscles</label>
                        <div className={styles.checkboxGrid}>
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

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate("/profile")}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Card>
        </Box>
    );
}