import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ColorTheme =
    | "charcoal"
    | "dark"
    | "light"
    | "pink"
    | "neon"
    | "orange";

type ThemeContextValue = {
    theme: ColorTheme;
    setTheme: (theme: ColorTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "color_theme";
const DEFAULT_THEME: ColorTheme = "dark";

function isColorTheme(value: string | null): value is ColorTheme {
    return (
        value === "charcoal" ||
        value === "dark" ||
        value === "light" ||
        value === "pink" ||
        value === "neon" ||
        value === "orange"
    );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ColorTheme>(() => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        if (isColorTheme(storedTheme)) {
            return storedTheme;
        }

        return DEFAULT_THEME;
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    function setTheme(newTheme: ColorTheme) {
        setThemeState(newTheme)
    }

    const value = useMemo(
        () => ({
            theme,
            setTheme,
        }),
        [theme],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside a ThemeProvider");
    }

    return context;
}

