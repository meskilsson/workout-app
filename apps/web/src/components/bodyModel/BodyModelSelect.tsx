import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { motion } from "motion/react";
import { useFieldMotion } from "../motion/useFieldMotion";
import { selectRest, selectHover, selectFocus } from "../motion/presets";
import type { BodyModelGender } from "@workout-app/shared";
import { useBodyModel } from "../../context/BodyModelContext";
import styles from './BodyModelSelect.module.css';


export default function BodyModelSelect() {
    useTranslation();
    const bodyModelOptions: { value: BodyModelGender; label: string }[] = [
    { value: "male", label: t("BodyModelSelect.male") },
    { value: "female", label: t("BodyModelSelect.female") },
];

    const fieldMotion = useFieldMotion();
    const { gender, setGender } = useBodyModel();

    return (
        <label className={styles.wrapper}>
            <span className={styles.label}>{t("BodyModelSelect.bodyModel")}</span>

            <motion.select {...fieldMotion("select", selectRest, selectFocus, selectHover)}
                className={styles.select}
                value={gender}
                onChange={(event) =>
                    setGender(event.target.value as BodyModelGender)
                }
            >
                {bodyModelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </motion.select>
        </label>
    );
}
