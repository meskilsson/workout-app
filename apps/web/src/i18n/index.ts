import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import sv from "./locales/sv.json";

export type Language = "en" | "sv";
export const LANGUAGE_STORAGE_KEY = "workout-language";
export function savedLanguage(storage?: Pick<Storage, "getItem">): Language {
    try { return storage?.getItem(LANGUAGE_STORAGE_KEY) === "sv" ? "sv" : "en"; }
    catch { return "en"; }
}
function initialLanguage(): Language {
    try { return savedLanguage(typeof window === "undefined" ? undefined : window.localStorage); }
    catch { return "en"; }
}
void i18next.use(initReactI18next).init({
    resources: { en: { translation: en }, sv: { translation: sv } },
    lng: initialLanguage(), fallbackLng: "en", supportedLngs: ["en", "sv"],
    keySeparator: false, interpolation: { escapeValue: false }, initAsync: false,
});
function updateDocument(language: string) {
    if (typeof document !== "undefined") document.documentElement.lang = language === "sv" ? "sv" : "en";
}
updateDocument(i18next.language);
i18next.on("languageChanged", updateDocument);
export async function changeLanguage(language: Language) {
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* A blocked storage must not prevent switching. */ }
    await i18next.changeLanguage(language);
}
export const t = i18next.t.bind(i18next);
export const locale = () => i18next.resolvedLanguage === "sv" ? "sv-SE" : "en-GB";
export function formatNumber(value: number | null | undefined): string {
    return value == null ? "" : new Intl.NumberFormat(locale(), { maximumFractionDigits: 20 }).format(value);
}
export function displayValue(value: string | undefined): string {
    if (!value) return "";
    if (i18next.resolvedLanguage !== "sv") return value;
    const normalized = value.trim().toLowerCase();
    const key = `values.${normalized}`;
    const categoryKey = `values.${normalized.replaceAll(" ", "_")}`;
    return i18next.exists(key) ? t(key) : i18next.exists(categoryKey) ? t(categoryKey) : value;
}

// Only translate messages owned by this application, never arbitrary user content.
const messageKeys = new Map<string, string>();
for (const [key, value] of Object.entries(en)) { messageKeys.set(value, key); messageKeys.set(sv[key as keyof typeof sv], key); }
export const isAppMessage = (message: string) => messageKeys.has(message);
export function translateMessage(message: string): string {
    const key = messageKeys.get(message);
    if (key) return t(key);
    for (const [template, templateKey] of messageKeys) {
        if (!template.includes("{{")) continue;
        const names: string[] = [];
        const pattern = template.split(/(\{\{\w+\}\})/).map(part => {
            if (part.startsWith("{{")) { names.push(part.slice(2, -2)); return "(.*?)"; }
            return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }).join("");
        const match = new RegExp(`^${pattern}$`).exec(message);
        if (match) return t(templateKey, Object.fromEntries(names.map((name, index) => [name, match[index + 1]])));
    }
    return message;
}
export default i18next;
