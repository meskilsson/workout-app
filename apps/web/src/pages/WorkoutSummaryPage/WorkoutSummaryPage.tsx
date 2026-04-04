import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import "../../components/ui/box/box.css";
import "../../components/ui/cards/card.css";
import "../../components/ui/button/button.css";

import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type SelectedExercises = {
  id: string;
  name: string;
};

type LocationState = {
  selectedExercises: SelectedExercises[];
};

export default function WorkoutSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  const selectedExercises = state?.selectedExercises ?? [];

  function handleContinue() {
    navigate("/workout", {
      state: { selectedExercises },
    });
  }

  return (
    <Box>
      <h2>Summary of your workout</h2>
      <Card variant="primary">
        {selectedExercises.map((exercise) => (
          <li key={exercise.id}>{exercise.name}</li>
        ))}
      </Card>
      <Button variant="primary" onClick={handleContinue}>
        {/* ON CLICK NAVIGERA TILL WORKOUT STARTA TIMER */}
        Start Workout
      </Button>
    </Box>
  );
}
