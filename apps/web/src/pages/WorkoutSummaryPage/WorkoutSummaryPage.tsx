import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import {
  getWorkoutDraftByIdRequest,
  startWorkoutDraftRequest,
} from "../../services/workoutDraftApi";

import styles from "./WorkoutSummaryPage.module.css";

type DraftExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: {
    weight: number | null;
    reps: number | null;
  }[];
};

type WorkoutDraft = {
  _id: string;
  status: "building" | "active" | "completed" | "abandoned";
  selectedMuscleGroups: string[];
  exercises: DraftExercise[];
};

export default function WorkoutSummaryPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [error, setError] = useState("");

  const selectedExercises = draft?.exercises ?? [];
  const totalExercises = selectedExercises.length;

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        navigate("/workout-select");
        return;
      }

      try {
        setError("");
        setIsLoadingDraft(true);

        const data: WorkoutDraft = await getWorkoutDraftByIdRequest(draftId);

        setDraft(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workout draft",
        );
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadDraft();
  }, [draftId, navigate]);

  async function handleContinue() {
    if (!draftId) {
      navigate("/workout-select");
      return;
    }

    try {
      setError("");
      setIsStartingWorkout(true);

      await startWorkoutDraftRequest(draftId);

      navigate(`/workout/${draftId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start workout",
      );
    } finally {
      setIsStartingWorkout(false);
    }
  }

  function handleBack() {
    if (draftId) {
      navigate(`/exercise-select/${draftId}`);
      return;
    }

    navigate("/workout-select");
  }

  if (isLoadingDraft) {
    return (
      <Box className={styles.page}>
        <Card className={styles.stateCard}>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.stateText}>Loading workout summary...</p>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.page}>
        <Card className={styles.stateCard}>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.stateText}>{error}</p>

          <Button type="button" variant="secondary" onClick={handleBack}>
            Go back
          </Button>
        </Card>
      </Box>
    );
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
              <Card key={exercise.exerciseId} className={styles.exerciseCard}>
                <div className={styles.exerciseHeader}>
                  <div>
                    <p className={styles.exerciseNumber}>
                      Exercise {index + 1}
                    </p>

                    <h3 className={styles.exerciseTitle}>
                      {exercise.exerciseName}
                    </h3>
                  </div>

                  <span className={styles.exerciseBadge}>Selected</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={styles.stateCard}>
            <p className={styles.stateText}>
              No exercises selected yet. Go back and choose at least one
              exercise.
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
            disabled={selectedExercises.length === 0 || isStartingWorkout}
          >
            {isStartingWorkout ? "Starting..." : "Start workout"}
          </Button>
        </div>
      </div>
    </Box>
  );
}