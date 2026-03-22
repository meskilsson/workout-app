import { useState } from 'react';
import Card from '../../components/ui/cards/Card';
import Box from '../../components/ui/box/Box';
import Button from '../../components/ui/button/Button';
import '../../components/ui/button/button.css';

import { useNavigate } from 'react-router-dom';

import { backExercises } from '../../components/workouts/muscle-groups/Back/back-exercises';
import { shoulderExercises } from '../../components/workouts/muscle-groups/Shoulders/shoulder-exercises';
import { bicepsExercises } from '../../components/workouts/muscle-groups/Biceps/bicep-exercises';
import { legExercises } from '../../components/workouts/muscle-groups/Legs/leg-exercises';
import { chestExercises } from '../../components/workouts/muscle-groups/Chest/chest-exercises';
import { tricepExercises } from '../../components/workouts/muscle-groups/Triceps/triceps-exercises';


const muscleGroupCards = [
    backExercises,
    shoulderExercises,
    bicepsExercises,
    legExercises,
    chestExercises,
    tricepExercises
];


export default function WorkoutSelectPage() {
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const navigate = useNavigate();

    const handleToggleGroup = (groupId: string) => {
        setSelectedGroups((prev) =>
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId]
        );
    };


    function handleContinue() {
        const selectedMuscleGroups = muscleGroupCards.filter((group) =>
            selectedGroups.includes(group.id)
        );

        navigate("/exercise-select", {
            state: { selectedMuscleGroups },
        });
    };


    return (
        <Box className="workout-select-page">
            <Box className="muscle-group-grid">
                {muscleGroupCards.map((group) => (
                    <Card
                        key={group.id}
                        title={group.title}
                        className={`muscle-group-card ${selectedGroups.includes(group.id)
                            ? 'muscle-group-card--selected'
                            : ''
                            }`}
                        onClick={() => handleToggleGroup(group.id)}
                    />
                ))}
            </Box>

            <Button
                variant="primary"
                onClick={handleContinue}
                disabled={selectedGroups.length === 0}
            >
                Continue
            </Button>
        </Box>
    );
}