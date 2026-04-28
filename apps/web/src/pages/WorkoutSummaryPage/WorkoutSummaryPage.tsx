import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import "../../components/ui/box/box.css";
import "../../components/ui/cards/card.css";
import "../../components/ui/button/button.css";

import { useLocation, useNavigate } from "react-router-dom";
import styles from "./WorkoutSummaryPage.module.css";

type SelectedExercise = {
  _id: string;
  name: string;
};

type LocationState = {
  selectedExercises: SelectedExercise[];
};

export default function WorkoutSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;
  const selectedExercises = state?.selectedExercises ?? [];

  function handleContinue() {
    navigate("/workout", {
      state: {
        selectedExercises,
      },
    });
  }

  function handleBack() {
    navigate("/exercise-select", {
      state,
    });
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <p className={styles.kicker}>Workout builder</p>
        <h1 className={styles.title}>Summary of your workout</h1>
        <p className={styles.subtitle}>
          Review your selected exercises before starting your session.
        </p>
      </div>

      <Card className={styles.summaryCard}>
        {selectedExercises.length > 0 ? (
          <ul className={styles.exerciseList}>
            {selectedExercises.map((exercise, index) => (
              <li key={exercise._id} className={styles.exerciseItem}>
                <span className={styles.exerciseNumber}>
                  {index + 1}
                </span>

                <span className={styles.exerciseName}>
                  {exercise.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>
            No exercises selected yet.
          </p>
        )}
      </Card>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          {selectedExercises.length === 0
            ? "Go back and choose exercises first."
            : `${selectedExercises.length} exercise${selectedExercises.length === 1 ? "" : "s"
            } selected.`}
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={selectedExercises.length === 0}
          >
            Start Workout
          </Button>
        </div>
      </div>
    </Box>
  );
}