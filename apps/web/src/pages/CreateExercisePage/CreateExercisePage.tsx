import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { createExerciseRequest } from "../../services/exerciseApi";


export default function CreateExercisePage() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [exerciseType, setExerciseType] = useState("");
    const [primaryMuscles, setPrimaryMuscles] = useState("");
    const [secondaryMuscles, setSecondaryMuscles] = useState("");
    const [equipment, setEquipment] = useState("");
    const [difficulty, setDifficulty] = useState("");

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function parseMuscleInput(value: string) {
        return value.split(",").map((muscle) => muscle.trim()).filter(Boolean);
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
                exerciseType: exerciseType ? (exerciseType as "strength" | "cardio" | "mobility") : undefined,
                primaryMuscles: parseMuscleInput(primaryMuscles),
                secondaryMuscles: parseMuscleInput(secondaryMuscles),
                equipment: equipment
                    ? (equipment as
                        | "bodyweight"
                        | "dumbbell"
                        | "barbell"
                        | "machine"
                        | "kettlebell"
                        | "band")
                    : undefined,
                difficulty: difficulty ? (difficulty as "beginner" | "intermediate" | "advanced") : undefined,
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
        <Box>
            <Card title="Create Custom Exercise">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Name *</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="e.g. Cable Chest Fly"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <label htmlFor="description">Description</label>
                    <input
                        id="description"
                        type="text"
                        placeholder="Short description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <label htmlFor="instructions">Instructions</label>
                    <input
                        id="instructions"
                        placeholder="How to perform the exercise"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />

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

                    <label htmlFor="primaryMuscles">Primary Muscles</label>
                    <input
                        id="primaryMuscles"
                        type="text"
                        placeholder="e.g. chest, shoulders, back"
                        value={primaryMuscles}
                        onChange={(e) => setPrimaryMuscles(e.target.value)}
                    />

                    <label htmlFor="secondaryMuscles">Secondary Muscles</label>
                    <input
                        id="secondaryMuscles"
                        type="text"
                        placeholder="e.g. triceps"
                        value={secondaryMuscles}
                        onChange={(e) => setSecondaryMuscles(e.target.value)}
                    />

                    <label htmlFor="equipment">Equipment</label>
                    <select
                        id="equipment"
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
                    >
                        <option value="">Select Equipment</option>
                        <option value="bodyweight">Bodyweight</option>
                        <option value="dumbbell">Dumbbell</option>
                        <option value="barbell">Barbell</option>
                        <option value="machine">Machine</option>
                        <option value="kettlebell">Kettlebell</option>
                        <option value="band">Bamd</option>
                    </select>

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

                    {error && <p>{error}</p>}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Exercise"}
                    </Button>
                </form>
            </Card>
        </Box>
    );
}