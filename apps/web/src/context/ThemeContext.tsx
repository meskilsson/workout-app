import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { readThemePreference, THEME_STORAGE_KEY, type ColorTheme } from "../utils/themePreference";
export type { ColorTheme } from "../utils/themePreference";

type ThemeContextValue = {
    theme: ColorTheme;
    setTheme: (theme: ColorTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ColorTheme>(readThemePreference);

    useLayoutEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Mode switching remains available when storage is restricted.
        }
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

