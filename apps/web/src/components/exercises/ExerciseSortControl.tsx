import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownUp } from "lucide-react";
import { EXERCISE_TYPE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS, MUSCLE_OPTIONS, type ExerciseFilters, type ExerciseSort } from "@workout-app/shared";
import { displayValue } from "../../i18n";
import Button from "../ui/button/Button";
import Modal from "../ui/modal/Modal";
import styles from "./ExerciseSortControl.module.css";

export default function ExerciseSortControl({ value, onChange, authenticated, filters, onFiltersChange }: {
    filters: ExerciseFilters; onFiltersChange: (filters: ExerciseFilters) => void;
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
            onClick={() => setOpen(true)}>{t("exercises.sortAndFilter")}{Object.values(filters).filter(value => Array.isArray(value) ? value.length : value).length > 0 ? ` (${Object.values(filters).filter(value => Array.isArray(value) ? value.length : value).length})` : ""}</Button>
        <Modal title={t("exercises.sortAndFilter")} isOpen={open} onClose={() => setOpen(false)}>
            <div className={styles.filters}>
                {([
                    ["exerciseType", "exercises.type", EXERCISE_TYPE_OPTIONS],
                    ["equipment", "exercises.equipment", EQUIPMENT_OPTIONS],
                    ["difficulty", "exercises.difficulty", DIFFICULTY_OPTIONS],
                    ["muscles", "exercises.muscle", MUSCLE_OPTIONS],
                ] as const).map(([key, label, values]) => <label key={key}>
                    {t(label)}
                    <select value={key === "muscles" ? filters.muscles?.[0] ?? "" : filters[key] ?? ""}
                        onChange={event => onFiltersChange({ ...filters, [key]: key === "muscles" ? (event.target.value ? [event.target.value] : []) : event.target.value || undefined })}>
                        <option value="">{t("exercises.all")}</option>
                        {values.map(option => <option key={option} value={option}>{displayValue(option).charAt(0).toLocaleUpperCase() + displayValue(option).slice(1)}</option>)}
                    </select>
                </label>)}
                <Button type="button" variant="ghost" onClick={() => onFiltersChange({})}>{t("exercises.clearFilters")}</Button>
            </div>
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
