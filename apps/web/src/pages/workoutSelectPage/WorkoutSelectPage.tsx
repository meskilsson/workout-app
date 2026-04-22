import { useState } from "react";
import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import "../../components/ui/button/button.css";
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
    <Box className="workout-select-page">
      <Box className="muscle-group-grid">
        {muscleGroupCards.map((group) => (
          <Card
            key={group.id}
            title={group.title}
            className={`muscle-group-card ${selectedGroups.includes(group.id)
                ? "muscle-group-card--selected"
                : ""
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