import { useTheme, type ColorTheme } from "../../context/ThemeContext";
import styles from "./ThemeSelect.module.css";

const themeOptions: { value: ColorTheme; label: string }[] = [
    { value: "charcoal", label: "Charcoal" },
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "pink", label: "Pink" },
    { value: "neon", label: "Neon" },
    { value: "orange", label: "Orange" },
];

export default function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <label className={styles.wrapper}>
            <span className={styles.label}>Theme</span>

            <select
                className={styles.select}
                value={theme}
                onChange={(event) => setTheme(event.target.value as ColorTheme)}
            >
                {themeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}