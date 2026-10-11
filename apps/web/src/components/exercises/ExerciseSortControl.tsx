import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownUp } from "lucide-react";
import { EXERCISE_TYPE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS, MUSCLE_OPTIONS, type ExerciseFilters, type ExerciseSort } from "@workout-app/shared";
import { displayValue } from "../../i18n";
import Modal from "../ui/modal/Modal";
import Button from "../ui/button/Button";
import styles from "./ExerciseSortControl.module.css";

export default function ExerciseSortControl({ value, onChange, authenticated, filters, onFiltersChange, onMobileOpenChange }: {
    onMobileOpenChange?: (open: boolean) => void;
    filters: ExerciseFilters; onFiltersChange: (filters: ExerciseFilters) => void;
    value: ExerciseSort; onChange: (value: ExerciseSort) => void; authenticated: boolean;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
    useEffect(() => {
        const media = window.matchMedia("(max-width: 900px)");
        const change = () => setMobile(media.matches);
        media.addEventListener("change", change);
        return () => media.removeEventListener("change", change);
    }, []);
    useEffect(() => {
        onMobileOpenChange?.(open && mobile);
        return () => onMobileOpenChange?.(false);
    }, [open, mobile, onMobileOpenChange]);
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const activeCount = Object.values(filters).filter(value => Array.isArray(value) ? value.length : value).length;
    useEffect(() => {
        if (!open || mobile) return;
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                root.current?.querySelector('button')?.focus();
            }
        };
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open, mobile]);
    const options: { value: ExerciseSort; label: string; description: string }[] = [
        { value: "name", label: t("ExerciseSelectPage.nameAZ"), description: t("ExerciseSelectPage.alphabeticalOrder") },
        { value: "popular", label: t("common.mostPopular"), description: t("ExerciseSelectPage.mostCompletedAcrossAllUsers") },
        ...(authenticated ? [{ value: "mostUsed" as const, label: t("common.myMostUsed"), description: t("ExerciseSelectPage.mostCompletedInYourWorkouts") }] : []),
    ];
    const content = <section id={id} className={mobile ? styles.sheetContent : styles.panel} aria-label={t("exercises.sortAndFilter")}>
            <fieldset className={styles.group}>
                <legend>{t("ExerciseSelectPage.orderExercisesBy")}</legend>
                <div className={styles.choices}>
                    {options.map(option => <label className={styles.choice} key={option.value} title={option.description}>
                        <input type="radio" name={`${id}-sort`} value={option.value} checked={value === option.value}
                            onChange={() => onChange(option.value)} />
                        <span>{option.label}</span>
                    </label>)}
                </div>
            </fieldset>
            {([
                ["exerciseType", "exercises.type", EXERCISE_TYPE_OPTIONS],
                ["equipment", "exercises.equipment", EQUIPMENT_OPTIONS],
                ["difficulty", "exercises.difficulty", DIFFICULTY_OPTIONS],
                ["muscles", "exercises.muscle", MUSCLE_OPTIONS],
            ] as const).map(([key, label, values]) => <fieldset className={styles.group} key={key}>
                <legend>{t(label)}</legend>
                <div className={styles.choices}>
                    {key !== "muscles" && <label className={styles.choice}>
                        <input type="radio" name={`${id}-${key}`} checked={!filters[key]}
                            onChange={() => onFiltersChange({ ...filters, [key]: undefined })} />
                        <span>{t("exercises.all")}</span>
                    </label>}
                    {values.map(option => <label className={styles.choice} key={option}>
                        <input type={key === "muscles" ? "checkbox" : "radio"} name={`${id}-${key}`} value={option}
                            checked={key === "muscles" ? filters.muscles?.some(muscle => muscle === option) ?? false : filters[key] === option}
                            onChange={event => {
                                if (key === "muscles") {
                                    const muscles = filters.muscles ?? [];
                                    onFiltersChange({ ...filters, muscles: event.target.checked
                                        ? [...muscles, option as typeof muscles[number]] : muscles.filter(muscle => muscle !== option) });
                                } else onFiltersChange({ ...filters, [key]: option });
                            }} />
                        <span>{displayValue(option).charAt(0).toLocaleUpperCase() + displayValue(option).slice(1)}</span>
                    </label>)}
                </div>
            </fieldset>)}
            <Button type="button" variant="ghost" disabled={!activeCount} onClick={() => onFiltersChange({})}>{t("exercises.clearFilters")}</Button>
        </section>;
    return <div className={styles.control} ref={root}>
        <Button type="button" variant="ghost" className={styles.trigger} icon={ArrowDownUp}
            aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup={mobile ? "dialog" : undefined}
            onClick={() => setOpen(previous => !previous)}>
            {t("exercises.sortAndFilter")}{activeCount ? ` (${activeCount})` : ""}
        </Button>
        {mobile ? <Modal variant="sheet" title={t("exercises.sortAndFilter")} isOpen={open} onClose={() => setOpen(false)}
            actions={<Button type="button" onClick={() => setOpen(false)}>{t("exercises.done")}</Button>}>
            {content}
        </Modal> : open && content}
    </div>;
}
