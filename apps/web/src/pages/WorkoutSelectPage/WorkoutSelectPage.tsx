import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { createWorkoutDraftRequest } from "../../services/workoutDraftApi";

import "../../components/ui/button/button.css";
import styles from "./WorkoutSelectPage.module.css";


const muscleGroupCards = [
  { id: "cardio", title: "Cardio" },
  { id: "back", title: "Back" },
  { id: "shoulders", title: "Shoulders" },
  { id: "biceps", title: "Biceps" },
  { id: "legs", title: "Legs" },
  { id: "chest", title: "Chest" },
  { id: "triceps", title: "Triceps" },
  { id: "core", title: "Abs" },
];

const backendMuscleGroupMap: Record<string, string[]> = {
  cardio: [],
  back: ["back"],
  shoulders: ["shoulders"],
  biceps: ["biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  chest: ["chest"],
  triceps: ["triceps"],
  core: ["core"],
};

export default function WorkoutSelectPage() {

  const [searchParams] = useSearchParams();

  const purpose =
    searchParams.get("purpose") === "template" ? "template" : "workout";

  const isTemplatePurpose = purpose === "template";


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
        includeCardio: selectedGroups.includes("cardio"),
        purpose,
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
        <p className={styles.kicker}>
          {isTemplatePurpose ? "Workout builder" : "Workout builder"}
        </p>

        <h1 className={styles.title}>
          {isTemplatePurpose ? "Choose workout muscles" : "Choose muscle groups"}
        </h1>

        <p className={styles.subtitle}>
          {isTemplatePurpose
            ? "Pick the muscle groups this reusable workout should include."
            : "Pick one or more muscle groups to build your workout session."}
        </p>
        <Button
          type="button"
          variant="secondary"
          style={{ minWidth: "3.25rem", marginTop: "1rem" }}
          iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
          onClick={() => navigate(-1)}

        >
          <Icon icon={ArrowLeft} />
        </Button>
      </div>

      <Box className={styles.grid}>
        {muscleGroupCards.map((group) => {
          const isSelected = selectedGroups.includes(group.id);

          return (
            <Card
              key={group.id}
              aria-label={group.title}
              aria-pressed={isSelected}
              aria-disabled={isCreatingDraft}
              className={`${styles.muscleGroupCard} ${isSelected ? styles.selectedCard : ""
                } ${isCreatingDraft ? styles.disabledCard : ""}`}
              onClick={() => handleToggleGroup(group.id)}
            >
              <span>{group.title}</span><Icon icon={isSelected ? CheckCircle2 : Circle} />
            </Card>
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

          {error && <p className={styles.errorText} role="alert">{error}</p>}
        </div>

        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={selectedGroups.length === 0 || isCreatingDraft}
        >
          {isCreatingDraft ? (
            <LoadingPredator
              size="small"
              color="currentColor"
              label="Creating draft..."
              showLabel
            />
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </Box>
  );
}
