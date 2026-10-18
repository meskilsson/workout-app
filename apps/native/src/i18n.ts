import en from "../../web/src/i18n/locales/en.json";
import sv from "../../web/src/i18n/locales/sv.json";
import { nativeStrings } from "./nativeStrings";

export type Language = "en" | "sv";
let language: Language = "en";
export function setLanguage(value: Language) {
  language = value;
}
export const locale = () => (language === "sv" ? "sv-SE" : "en-GB");
export function t(key: string, values: Record<string, string | number> = {}) {
  const resource = language === "sv" ? sv : en;
  const aliases: Record<string, string> = {
    "common.duration": "Duration",
    "common.rest": "Rest",
    "common.work": "Work",
    "common.loading": "Loading…",
    "common.restTimer": "Rest timer",
    "common.rounds": "Rounds",
    "common.weight": "Weight",
  };
  const template =
    (resource as Record<string, string>)[key] ??
    (en as Record<string, string>)[key] ??
    label(aliases[key] ?? key);
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    String(values[name] ?? ""),
  );
}
const keys = new Map<string, string>();
for (const [key, text] of Object.entries(en)) {
  keys.set(text, key);
  const translated = (sv as Record<string, string>)[key];
  if (translated) keys.set(translated, key);
}
const templates = [...keys.entries()]
  .filter(([text]) => text.includes("{{"))
  .map(([text, key]) => {
    const names: string[] = [];
    const pattern = text
      .split(/(\{\{\w+\}\})/)
      .map((part) => {
        if (part.startsWith("{{")) {
          names.push(part.slice(2, -2));
          return "(.*?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    return { key, names, pattern: new RegExp(`^${pattern}$`) };
  });
function translatedTemplate(text: string): string | undefined {
  for (const template of templates) {
    const match = template.pattern.exec(text);
    if (match)
      return t(
        template.key,
        Object.fromEntries(
          template.names.map((name, i) => [name, match[i + 1]]),
        ),
      );
  }
}
export function label(text: string): string {
  if (language === "sv" && nativeStrings[text]) return nativeStrings[text];
  if (text.includes(" · ")) return text.split(" · ").map(label).join(" · ");
  const key = keys.get(text);
  if (key) return t(key);
  const valueKey = `values.${text.toLowerCase().replaceAll(" ", "_")}`;
  return valueKey in en ? t(valueKey) : (translatedTemplate(text) ?? text);
}
export function errorLabel(text: string) {
  const translated = label(text);
  return language === "sv" &&
    translated === text &&
    !keys.has(text) &&
    translatedTemplate(text) === undefined
    ? t("formValidation.somethingWentWrongPleaseTryAgain")
    : translated;
}
export function exerciseName(exercise: {
  name: string;
  isCustom?: boolean;
  translations?: { sv?: { name?: string } };
}) {
  return language === "sv" && !exercise.isCustom
    ? (exercise.translations?.sv?.name ?? exercise.name)
    : exercise.name;
}
export const number = (value: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value);
