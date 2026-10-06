export type ColorTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "color_theme";

export function resolveThemePreference(saved: string | null, prefersDark: boolean): ColorTheme {
    if (saved === "light" || saved === "pink") return "light";
    if (["dark", "charcoal", "neon", "orange", "space"].includes(saved ?? "")) return "dark";
    return prefersDark ? "dark" : "light";
}

export function readThemePreference(): ColorTheme {
    let saved: string | null = null;
    try {
        saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
        // Storage restrictions must not prevent the interface from rendering.
    }
    return resolveThemePreference(saved, window.matchMedia("(prefers-color-scheme: dark)").matches);
}
