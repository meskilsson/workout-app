import { useState } from "react";
import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import "../../components/ui/button/button.css";
import styles from "./WorkoutSelectPage.module.css";
import { useNavigate } from "react-router-dom";

const muscleGroupCards = [
  { id: "back", title: "Back" },
  { id: "shoulders", title: "Shoulders" },
  { id: "biceps", title: "Biceps" },
  { id: "legs", title: "Legs" },
  { id: "chest", title: "Chest" },
  { id: "triceps", title: "Triceps" },
];

export default function WorkoutSelectPage() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  function handleContinue() {
    const selectedMuscleGroups = muscleGroupCards.filter((group) =>
      selectedGroups.includes(group.id),
    );

    navigate("/exercise-select", {
      state: { selectedMuscleGroups },
    });
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
        {muscleGroupCards.map((group) => (
          <Card
            key={group.id}
            title={group.title}
            className={`${styles.muscleGroupCard} ${selectedGroups.includes(group.id) ? styles.selectedCard : ""
              }`}
            onClick={() => handleToggleGroup(group.id)}
          />
        ))}
      </Box>

      <div className={styles.footer}>
        <p className={styles.selectedCount}>
          {selectedGroups.length === 0
            ? "Select at least one muscle group"
            : `${selectedGroups.length} selected`}
        </p>

        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={selectedGroups.length === 0}
        >
          Continue
        </Button>
      </div>
    </Box>
  );
}