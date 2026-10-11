import { motion } from "motion/react";
import { useFieldMotion } from "../motion/useFieldMotion";
import { selectRest, selectHover, selectFocus } from "../motion/presets";
import type { BodyModelGender } from "@workout-app/shared";
import { useBodyModel } from "../../context/BodyModelContext";
import styles from './BodyModelSelect.module.css';

const bodyModelOptions: { value: BodyModelGender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
];

export default function BodyModelSelect() {
    const fieldMotion = useFieldMotion();
    const { gender, setGender } = useBodyModel();

    return (
        <label className={styles.wrapper}>
            <span className={styles.label}>Body model</span>

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
