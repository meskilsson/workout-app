import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

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

  const totalExercises = selectedExercises.length;

  function handleContinue() {
    navigate("/workout", {
      state: {
        selectedExercises,
      },
    });
  }

  function handleBack() {
    navigate(-1);
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.subtitle}>
            Review your selected exercises before starting your session.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={handleBack}>
          Back
        </Button>
      </div>

      <Card className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Exercises</span>
            <span className={styles.summaryValue}>{totalExercises}</span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Status</span>
            <span className={styles.summaryValue}>
              {totalExercises > 0 ? "Ready" : "Incomplete"}
            </span>
          </div>
        </div>
      </Card>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Selected exercises</h2>
            <p className={styles.sectionText}>
              These exercises will be included in your workout session.
            </p>
          </div>
        </div>

        {selectedExercises.length > 0 ? (
          <div className={styles.exerciseList}>
            {selectedExercises.map((exercise, index) => (
              <Card key={exercise._id} className={styles.exerciseCard}>
                <div className={styles.exerciseHeader}>
                  <div>
                    <p className={styles.exerciseNumber}>
                      Exercise {index + 1}
                    </p>

                    <h3 className={styles.exerciseTitle}>
                      {exercise.name}
                    </h3>
                  </div>

                  <span className={styles.exerciseBadge}>
                    Selected
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={styles.stateCard}>
            <p className={styles.stateText}>
              No exercises selected yet. Go back and choose at least one exercise.
            </p>
          </Card>
        )}
      </section>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          {selectedExercises.length === 0
            ? "Choose exercises before starting."
            : `${selectedExercises.length} exercise${selectedExercises.length === 1 ? "" : "s"
            } ready.`}
        </p>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleContinue}
            disabled={selectedExercises.length === 0}
          >
            Start workout
          </Button>
        </div>
      </div>
    </Box>
  );
}