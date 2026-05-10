import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";

import { createWorkoutDraftRequest } from "../../services/workoutDraftApi";

import "../../components/ui/button/button.css";
import styles from "./WorkoutSelectPage.module.css";

const muscleGroupCards = [
  { id: "back", title: "Back" },
  { id: "shoulders", title: "Shoulders" },
  { id: "biceps", title: "Biceps" },
  { id: "legs", title: "Legs" },
  { id: "chest", title: "Chest" },
  { id: "triceps", title: "Triceps" },
];

const backendMuscleGroupMap: Record<string, string[]> = {
  back: ["back"],
  shoulders: ["shoulders"],
  biceps: ["biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  chest: ["chest"],
  triceps: ["triceps"],
};

export default function WorkoutSelectPage() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleToggleGroup = (groupId: string) => {
    if (isCreatingDraft) {
      return;
    }

    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  async function handleContinue() {
    try {
      setError("");
      setIsCreatingDraft(true);

      const selectedMuscleGroups = [
        ...new Set(
          selectedGroups.flatMap(
            (groupId) => backendMuscleGroupMap[groupId] ?? [groupId],
          ),
        ),
      ];

      const draft = await createWorkoutDraftRequest({
        selectedMuscleGroups,
      });

      navigate(`/exercise-select/${draft._id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workout draft",
      );
    } finally {
      setIsCreatingDraft(false);
    }
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <p className={styles.kicker}>Workout builder</p>
        <h1 className={styles.title}>Choose muscle groups</h1>
        <p className={styles.subtitle}>
          Pick one or more muscle groups to build your workout session.
        </p>
      </div>

      <Box className={styles.grid}>
        {muscleGroupCards.map((group) => {
          const isSelected = selectedGroups.includes(group.id);

          return (
            <Card
              key={group.id}
              title={group.title}
              className={`${styles.muscleGroupCard} ${isSelected ? styles.selectedCard : ""
                } ${isCreatingDraft ? styles.disabledCard : ""}`}
              onClick={() => handleToggleGroup(group.id)}
            />
          );
        })}
      </Box>

      <div className={styles.footer}>
        <div>
          <p className={styles.selectedCount}>
            {selectedGroups.length === 0
              ? "Select at least one muscle group"
              : `${selectedGroups.length} selected`}
          </p>

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={selectedGroups.length === 0 || isCreatingDraft}
        >
          {isCreatingDraft ? "Creating draft..." : "Continue"}
        </Button>
      </div>
    </Box>
  );
}