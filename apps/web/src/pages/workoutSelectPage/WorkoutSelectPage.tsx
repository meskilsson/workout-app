import Card from '../../components/ui/cards/Card';
import Box from '../../components/ui/box/Box';
import * as muscleGroups from '../../components/workouts/muscle-groups';


export default function WorkoutSelectPage() {



    return (
        <Box>
            <Card>
                {muscleGroups.map((exercise) => (
                    <li
                        key={exercise.name}
                    >
                        {exercise.name}
                    </li>
                ))}
            </Card>
        </Box>
    );
}