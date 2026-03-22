import { useLocation } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useState } from "react";
import Input from "../../components/ui/input/Input";

type SelectedExercises = {
    id: string;
    name: string;
    muscleGroup: string;
}

type LocationState = {
    selectedExercises: SelectedExercises[];
}

type WorkoutSet = {
    weight: string;
    reps: string;
}



export default function WorkoutPage() {


    const location = useLocation();
    const state = location.state as LocationState | null;
    const selectedExercises = state?.selectedExercises ?? [];

    const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({});


    function handleAddSet(exerciseId: string) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: [...(prev[exerciseId] ?? []), { weight: '', reps: '' }],
        }));
    }

    function handleSetChange(
        exerciseId: string,
        index: number,
        field: 'weight' | 'reps',
        value: string
    ) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).map((set, i) =>
                i === index ? { ...set, [field]: value } : set
            ),
        }));
    }

    function handleRemoveSet(exerciseId: string, index: number) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).filter((_, i) => i !== index),
        }));
    }


    return (
        <Box>
            <Box>
                <Card>
                    {selectedExercises.map((exercise) => {
                        const exerciseSets = setsByExercise[exercise.id] ?? [];

                        return (
                            <Card key={exercise.id}>
                                <span>{exercise.muscleGroup}</span>

                                <li>
                                    {exercise.name}
                                    <div style={{ display: "flex", justifyContent: "right" }}>
                                        <Button onClick={() => handleAddSet(exercise.id)}>
                                            Add set
                                        </Button>
                                    </div>
                                </li>

                                <div>
                                    {exerciseSets.map((set, index) => (
                                        <div key={index}>
                                            <input
                                                type="number"
                                                placeholder="Weight"
                                                value={set.weight}
                                                onChange={(e) =>
                                                    handleSetChange(exercise.id, index, "weight", e.target.value)
                                                }
                                            />

                                            <input
                                                type="number"
                                                placeholder="Reps"
                                                value={set.reps}
                                                onChange={(e) =>
                                                    handleSetChange(exercise.id, index, "reps", e.target.value)
                                                }
                                            />

                                            <Button onClick={() => handleRemoveSet(exercise.id, index)}>
                                                X
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </Card>
            </Box>
        </Box>
    );
}