import { useTheme, type ColorTheme } from "../../context/ThemeContext";

const themeOptions: { value: ColorTheme; label: string }[] = [
    { value: "charcoal", label: "Charcoal" },
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "pink", label: "Pink" },
    { value: "neon", label: "Neon" },
];

export default function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <label>
            Theme
            <select
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