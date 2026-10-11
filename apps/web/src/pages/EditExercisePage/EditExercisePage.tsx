import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { reportFormError, friendlyError } from "../../utils/formValidation";
import ValidatedForm from "../../components/forms/ValidatedForm";
import { motion } from "motion/react";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import { authRest, authFocus } from "../../components/motion/presets";
import { Check } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { exerciseDetailOptions } from "../../query/resourceQueries";
import { useUpdateExerciseMutation } from "../../query/useExerciseMutations";
import { useNavigate, useParams } from "../../routes/navigationHooks";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import {
    DIFFICULTY_OPTIONS,
    EQUIPMENT_OPTIONS,
    EXERCISE_TYPE_OPTIONS,
    MUSCLE_OPTIONS,
    type Difficulty,
    type Equipment,
    type ExerciseType,
    type Muscle,
    type Exercise,
} from "@workout-app/shared";

import styles from './EditExercisePage.module.css';

function isMuscle(value: string): value is Muscle {
    return MUSCLE_OPTIONS.includes(value as Muscle);
}

function normalizeMuscles(muscles: string[] | undefined): Muscle[] {
    return (muscles ?? []).filter(isMuscle);
}

function isExerciseType(value: string | undefined): value is ExerciseType {
    return !!value && EXERCISE_TYPE_OPTIONS.includes(value as ExerciseType);
}

function isEquipment(value: string | undefined): value is Equipment {
    return !!value && EQUIPMENT_OPTIONS.includes(value as Equipment);
}

function isDifficulty(value: string | undefined): value is Difficulty {
    return !!value && DIFFICULTY_OPTIONS.includes(value as Difficulty);
}



export default function EditExercisePage() {
    useTranslation();
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const exerciseQuery = useQuery(exerciseDetailOptions(user?._id, id ?? ""));
    if (id && exerciseQuery.isPending) {
        return <LoadingState layout="form" className={styles.page} title={t("common.editExercise")} message={t("EditExercisePage.loadingExercise")} />;
    }
    if (!exerciseQuery.data) {
        return <Box className={styles.page}><Card className={styles.card}>
            <p className={styles.errorText} role="alert">{(exerciseQuery.error ? friendlyError(exerciseQuery.error, t("common.exerciseNotFound")) : t("common.exerciseNotFound"))}</p>
            <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.goBack")}</Button>
        </Card></Box>;
    }
    return <EditExerciseForm key={user?._id + ":" + id} exercise={exerciseQuery.data} />;
}

function EditExerciseForm({ exercise }: { exercise: Exercise }) {
    useTranslation();
    const fieldMotion = useFieldMotion(0.2);
    const navigate = useNavigate();
    const id = exercise._id;
    const [name, setName] = useState(exercise.name ?? "");
    const [description, setDescription] = useState(exercise.description ?? "");
    const [instructions, setInstructions] = useState(exercise.instructions ?? "");
    const [exerciseType, setExerciseType] = useState<ExerciseType | "">(
        isExerciseType(exercise.exerciseType) ? exercise.exerciseType : "",
    );
    const [primaryMuscles, setPrimaryMuscles] = useState<Muscle[]>(() => normalizeMuscles(exercise.primaryMuscles));
    const [secondaryMuscles, setSecondaryMuscles] = useState<Muscle[]>(() => normalizeMuscles(exercise.secondaryMuscles));
    const [equipment, setEquipment] = useState<Equipment | "">(isEquipment(exercise.equipment) ? exercise.equipment : "");
    const [difficulty, setDifficulty] = useState<Difficulty | "">(isDifficulty(exercise.difficulty) ? exercise.difficulty : "");
    const [imageUrl] = useState(exercise.imageUrl ?? "");
    const [error, setError] = useState("");
    const updateMutation = useUpdateExerciseMutation();
    const isSaving = updateMutation.isPending;

    function toggleMuscle(
        muscle: Muscle,
        setSelected: React.Dispatch<React.SetStateAction<Muscle[]>>,
    ) {
        setSelected((prev) =>
            prev.includes(muscle)
                ? prev.filter((item) => item !== muscle)
                : [...prev, muscle],
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const submittedForm = e.currentTarget;
        if (isSaving) return;

        if (!id) {
            setError(t("EditExercisePage.exerciseIdIsMissing"));
            return;
        }

        setError("");

        try {
            await updateMutation.mutateAsync({ id, data: {
                name,
                description: description || undefined,
                instructions: instructions || undefined,
                exerciseType: exerciseType || undefined,
                primaryMuscles,
                secondaryMuscles,
                equipment: equipment || undefined,
                difficulty: difficulty || undefined,
                imageUrl,
            } });

            navigate("/profile");
        } catch (err) {
            if (!reportFormError(submittedForm, err)) setError(friendlyError(err, t("common.unableToSavePleaseTryAgain")));
        }
    }

    return (
        <Box className={styles.page}>
            <Card variant="default" className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t("common.editExercise")}</h1>
                    <p className={styles.subtitle}> {t("EditExercisePage.updateYourCustomExerciseDetails")} </p>
                </div>

                <ValidatedForm onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="name">{t("common.name2")}</label>
                        <motion.input {...fieldMotion("name", authRest, authFocus)}
                            id="name" required minLength={2} maxLength={50}
                            type="text"
                            placeholder={t("common.eGCableChestFly")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="description">{t("common.description")}</label>
                        <motion.input {...fieldMotion("description", authRest, authFocus)}
                            id="description"
                            type="text"
                            placeholder={t("common.shortDescription")}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="instructions">{t("common.instructions")}</label>
                        <motion.textarea {...fieldMotion("instructions", authRest, authFocus)}
                            id="instructions"
                            placeholder={t("common.howToPerformTheExercise")}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="exerciseType">{t("common.exerciseType")}</label>
                            <motion.select {...fieldMotion("exerciseType", authRest, authFocus)}
                                id="exerciseType"
                                value={exerciseType}
                                onChange={(e) =>
                                    setExerciseType((e.target.value as ExerciseType | "") || "")
                                }
                            >
                                <option value="">{t("common.selectType")}</option>
                                {EXERCISE_TYPE_OPTIONS.map((type) => (
                                    <option key={type} value={type}>
                                        {displayValue(type)}
                                    </option>
                                ))}
                            </motion.select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="difficulty">{t("common.difficulty")}</label>
                            <motion.select {...fieldMotion("difficulty", authRest, authFocus)}
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) =>
                                    setDifficulty((e.target.value as Difficulty | "") || "")
                                }
                            >
                                <option value="">{t("common.selectDifficulty")}</option>
                                {DIFFICULTY_OPTIONS.map((level) => (
                                    <option key={level} value={level}>
                                        {displayValue(level)}
                                    </option>
                                ))}
                            </motion.select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="equipment">{t("common.equipment")}</label>
                        <motion.select {...fieldMotion("equipment", authRest, authFocus)}
                            id="equipment"
                            value={equipment}
                            onChange={(e) =>
                                setEquipment((e.target.value as Equipment | "") || "")
                            }
                        >
                            <option value="">{t("common.selectEquipment")}</option>
                            {EQUIPMENT_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {displayValue(item)}
                                </option>
                            ))}
                        </motion.select>
                    </div>

                    <div className={styles.field}>
                        <span id="primary-muscles-label">{t("common.primaryMuscles")}</span>
                        <div className={styles.checkboxGrid} role="group" aria-labelledby="primary-muscles-label">
                            {MUSCLE_OPTIONS.map((muscle) => (
                                <motion.label key={displayValue(muscle)} className={styles.checkboxOption} initial={false}
                                    animate={{ backgroundColor: "var(--color-background-soft)", borderColor: "var(--color-border-soft)" }}
                                    whileHover={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary-border)" }} transition={fieldMotion("checkbox", {}, {}).transition}>
                                    <input
                                        type="checkbox"
                                        checked={primaryMuscles.includes(muscle)}
                                        onChange={() => toggleMuscle(muscle, setPrimaryMuscles)}
                                    />
                                    <span>{displayValue(muscle)}</span>
                                </motion.label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <span id="secondary-muscles-label">{t("common.secondaryMuscles")}</span>
                        <div className={styles.checkboxGrid} role="group" aria-labelledby="secondary-muscles-label">
                            {MUSCLE_OPTIONS.map((muscle) => (
                                <motion.label key={displayValue(muscle)} className={styles.checkboxOption} initial={false}
                                    animate={{ backgroundColor: "var(--color-background-soft)", borderColor: "var(--color-border-soft)" }}
                                    whileHover={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary-border)" }} transition={fieldMotion("checkbox", {}, {}).transition}>
                                    <input
                                        type="checkbox"
                                        checked={secondaryMuscles.includes(muscle)}
                                        onChange={() => toggleMuscle(muscle, setSecondaryMuscles)}
                                    />
                                    <span>{displayValue(muscle)}</span>
                                </motion.label>
                            ))}
                        </div>
                    </div>

                    {error && <p className={styles.error} role="alert">{translateMessage(error)}</p>}

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate("/profile")}
                            disabled={isSaving}
                        > {t("common.cancel")} </Button>

                        <Button icon={Check} type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label={t("common.saving")}
                                    showLabel
                                />
                            ) : (
                                t("common.saveChanges")
                            )}
                        </Button>
                    </div>
                </ValidatedForm>
            </Card>
        </Box>
    );
}
