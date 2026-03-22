import { useLocation } from 'react-router-dom';
import Card from '../../components/ui/cards/Card';
import Box from '../../components/ui/box/Box';
import Button from '../../components/ui/button/Button';
import '../../components/ui/button/button.css';
import '../../components/ui/box/box.css'
import '../../components/ui/cards/card.css'

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';



type Exercise = {
    id: string;
    name: string;
};

type SelectedMuscleGroup = {
    id: string;
    title: string;
    exercises: Exercise[];
};

type LocationState = {
    selectedMuscleGroups: SelectedMuscleGroup[];
};

export default function ExerciseSelectPage() {


    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState | null;

    const selectedMuscleGroups = state?.selectedMuscleGroups ?? [];

    function handleToggleExercise(exerciseId: string) {
        setSelectedExercises((prev) =>
            prev.includes(exerciseId)
                ? prev.filter((id) => id !== exerciseId)
                : [...prev, exerciseId]
        );
    }

    const chosenExercises = selectedMuscleGroups
        .flatMap((group) => group.exercises)
        .filter((exercise) => selectedExercises.includes(exercise.id));

    function handleContinue() {
        navigate('/workout-summary', {
            state: { selectedExercises: chosenExercises },
        });
    }



    return (
        <Box className="exercise-select-page">
            <h1>Select Exercises</h1>

            <Box className="muscle-group-grid">
                {selectedMuscleGroups.map((group) => (
                    <Box key={group.id} className="exercise-group">
                        <h2>{group.title}</h2>

                        <Box className="exercise-card-grid">
                            {group.exercises.map((exercise) => (
                                <Card
                                    key={exercise.id}
                                    className={`exercise-card ${selectedExercises.includes(exercise.id)
                                        ? 'muscle-group-card--selected'
                                        : ''
                                        }`}
                                    onClick={() => handleToggleExercise(exercise.id)}
                                >
                                    {exercise.name}
                                </Card>
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>

            <Button onClick={handleContinue} disabled={chosenExercises.length === 0}>
                Continue
            </Button>
        </Box>
    );
}