import type { BodyModelGender } from "@workout-app/shared";
import { useBodyModel } from "../../context/BodyModelContext";
import styles from './BodyModelSelect.module.css';

const bodyModelOptions: { value: BodyModelGender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
];

export default function BodyModelSelect() {
    const { gender, setGender } = useBodyModel();

    return (
        <label className={styles.wrapper}>
            <span className={styles.label}>Body model</span>

            <select
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
            </select>
        </label>
    );
}
