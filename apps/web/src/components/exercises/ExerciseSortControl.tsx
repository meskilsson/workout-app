import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownUp } from "lucide-react";
import type { ExerciseSort } from "@workout-app/shared";
import Button from "../ui/button/Button";
import Modal from "../ui/modal/Modal";
import styles from "./ExerciseSortControl.module.css";

export default function ExerciseSortControl({ value, onChange, authenticated }: {
    value: ExerciseSort; onChange: (value: ExerciseSort) => void; authenticated: boolean;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const options: { value: ExerciseSort; label: string; description: string }[] = [
        { value: "name", label: t("ExerciseSelectPage.nameAZ"), description: t("ExerciseSelectPage.alphabeticalOrder") },
        { value: "popular", label: t("common.mostPopular"), description: t("ExerciseSelectPage.mostCompletedAcrossAllUsers") },
        ...(authenticated ? [{ value: "mostUsed" as const, label: t("common.myMostUsed"), description: t("ExerciseSelectPage.mostCompletedInYourWorkouts") }] : []),
    ];
    return <>
        <Button type="button" variant="ghost" className={styles.trigger} icon={ArrowDownUp}
            aria-haspopup="dialog" aria-expanded={open}
            aria-label={t("ExerciseSelectPage.sortExercisesValue", { value0: options.find(option => option.value === value)?.label })}
            onClick={() => setOpen(true)}>{t("ExerciseSelectPage.sort")}</Button>
        <Modal title={t("ExerciseSelectPage.sortExercises")} isOpen={open} onClose={() => setOpen(false)}>
            <fieldset className={styles.options}>
                <legend>{t("ExerciseSelectPage.orderExercisesBy")}</legend>
                {options.map(option => <label className={styles.option} key={option.value}>
                    <input type="radio" name="exercise-sort" value={option.value} checked={value === option.value}
                        onChange={() => { onChange(option.value); setOpen(false); }} />
                    <span>{option.label}<small>{option.description}</small></span>
                </label>)}
            </fieldset>
        </Modal>
    </>;
}
