import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { motion } from "motion/react";
import { useFieldMotion } from "../motion/useFieldMotion";
import { selectRest, selectHover, selectFocus } from "../motion/presets";
import { Sun, Moon } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { useTheme, type ColorTheme } from "../../context/ThemeContext";
import styles from "./ThemeSelect.module.css";


export default function ThemeSelect() {
    useTranslation();
    const themeOptions: { value: ColorTheme; label: string }[] = [
    { value: "light", label: t("ThemeSelect.light") },
    { value: "dark", label: t("ThemeSelect.dark") },
];

    const fieldMotion = useFieldMotion();
    const { theme, setTheme } = useTheme();

    return (
        <label className={styles.wrapper}>
            <span className={styles.label}><Icon icon={theme === "light" ? Sun : Moon} /> {t("ThemeSelect.theme")}</span>

            <motion.select {...fieldMotion("select", selectRest, selectFocus, selectHover)}
                className={styles.select}
                value={theme}
                onChange={(event) => setTheme(event.target.value as ColorTheme)}
            >
                {themeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </motion.select>
        </label>
    );
}
