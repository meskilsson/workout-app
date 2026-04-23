import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { createExerciseRequest } from "../../services/exerciseApi";
import { MUSCLE_OPTIONS, type Muscle } from "../../constants/muscles";
import styles from "./CreateExercisePage.module.css";

export default function CreateExercisePage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [exerciseType, setExerciseType] = useState("");
    const [primaryMuscles, setPrimaryMuscles] = useState<Muscle[]>([]);
    const [secondaryMuscles, setSecondaryMuscles] = useState<Muscle[]>([]);
    const [equipment, setEquipment] = useState("");
    const [difficulty, setDifficulty] = useState("");

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function toggleMuscle(
        muscle: Muscle,
        selected: Muscle[],
        setSelected: React.Dispatch<React.SetStateAction<Muscle[]>>,
    ) {
        setSelected((prev) =>
            prev.includes(muscle)
                ? prev.filter((item) => item !== muscle)
                : [...prev, muscle],
        );
    }

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await createExerciseRequest({
                name,
                description: description || undefined,
                instructions: instructions || undefined,
                exerciseType: exerciseType
                    ? (exerciseType as "strength" | "cardio" | "mobility")
                    : undefined,
                primaryMuscles,
                secondaryMuscles,
                equipment: equipment
                    ? (equipment as
                        | "bodyweight"
                        | "dumbbell"
                        | "barbell"
                        | "machine"
                        | "kettlebell"
                        | "band")
                    : undefined,
                difficulty: difficulty
                    ? (difficulty as "beginner" | "intermediate" | "advanced")
                    : undefined,
            });

            navigate("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to create exercise");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box className={styles.page}>
            <Card variant="default" className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Custom Exercise</h1>
                    <p className={styles.subtitle}>
                        Add your own movement to your exercise library.
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
                                onChange={(e) => setExerciseType(e.target.value)}
                            >
                                <option value="">Select type</option>
                                <option value="strength">Strength</option>
                                <option value="cardio">Cardio</option>
                                <option value="mobility">Mobility</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="difficulty">Difficulty</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="">Select difficulty</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="equipment">Equipment</label>
                        <select
                            id="equipment"
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                        >
                            <option value="">Select equipment</option>
                            <option value="bodyweight">Bodyweight</option>
                            <option value="dumbbell">Dumbbell</option>
                            <option value="barbell">Barbell</option>
                            <option value="machine">Machine</option>
                            <option value="kettlebell">Kettlebell</option>
                            <option value="band">Band</option>
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
                                        onChange={() =>
                                            toggleMuscle(muscle, primaryMuscles, setPrimaryMuscles)
                                        }
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
                                        onChange={() =>
                                            toggleMuscle(muscle, secondaryMuscles, setSecondaryMuscles)
                                        }
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
                            onClick={() => navigate("/dashboard")}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Exercise"}
                        </Button>
                    </div>
                </form>
            </Card>
        </Box>
    );
}