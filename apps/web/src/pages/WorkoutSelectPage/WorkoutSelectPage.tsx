import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { cardRest, cardHover, selectedCard } from "../../components/motion/presets";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { createWorkoutDraftRequest } from "../../services/workoutDraftApi";

import "../../components/ui/button/button.css";
import styles from "./WorkoutSelectPage.module.css";



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
    useTranslation();
    const muscleGroupCards = [
  { id: "legs", title: displayValue("legs") },
  { id: "back", title: displayValue("Back") },
  { id: "chest", title: displayValue("chest") },
  { id: "shoulders", title: displayValue("shoulders") },
  { id: "biceps", title: displayValue("biceps") },
  { id: "triceps", title: displayValue("triceps") },
  { id: "core", title: t("common.abs") },
  { id: "cardio", title: t("common.cardio") },
];


  const [searchParams] = useSearchParams();

  const purpose =
    searchParams.get("purpose") === "template" ? "template" : "workout";

  const isTemplatePurpose = purpose === "template";


  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const createDraft = useMutation({ mutationFn: createWorkoutDraftRequest });
  const isCreatingDraft = createDraft.isPending;
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
    if (isCreatingDraft || selectedGroups.length === 0) return;
    try {
      setError("");

      const selectedMuscleGroups = [
        ...new Set(
          selectedGroups.flatMap(
            (groupId) => backendMuscleGroupMap[groupId] ?? [groupId],
          ),
        ),
      ];

      const draft = await createDraft.mutateAsync({
        selectedMuscleGroups,
        includeCardio: selectedGroups.includes("cardio"),
        purpose,
      });

      navigate(`/exercise-select/${draft._id}`);
    } catch (err) {
      setError(
        friendlyError(err, t("common.failedToCreateWorkoutDraft")),
      );
    }
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>

        <h1 className={styles.title}>
          {isTemplatePurpose ? t("WorkoutSelectPage.chooseWorkoutMuscles") : t("WorkoutSelectPage.chooseMuscleGroups")}
        </h1>

        <p className={styles.subtitle}>
          {isTemplatePurpose
            ? t("WorkoutSelectPage.pickTheMuscleGroupsThisReusableWorkoutShouldInclude")
            : t("WorkoutSelectPage.pickOneOrMoreMuscleGroupsToBuildYour")}
        </p>
        <Button
          type="button"
          variant="secondary"
          style={{ minWidth: "3.25rem", marginTop: "1rem" }}
          iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
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
              animate={isSelected ? selectedCard : cardRest}
              whileHover={isSelected ? selectedCard : cardHover}
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
              ? t("WorkoutSelectPage.selectAtLeastOneMuscleGroup")
              : t("WorkoutSelectPage.valueSelected", { value0: selectedGroups.length })}
          </p>

          {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
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
              label={t("WorkoutSelectPage.creatingDraft")}
              showLabel
            />
          ) : (
            t("WorkoutSelectPage.continue")
          )}
        </Button>
      </div>
    </Box>
  );
}
