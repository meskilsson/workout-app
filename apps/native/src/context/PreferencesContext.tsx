import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setLanguage, type Language } from "../i18n";
import { lightTheme, darkTheme } from "../styles/themes";
import { useAuth } from "./AuthContext";
import { AccessibilityInfo } from "react-native";

type Preferences = {
  language: Language;
  theme: "light" | "dark";
  bodyModel: "male" | "female";
  sound: boolean;
  vibration: boolean;
  notifications: boolean;
  restSeconds: number;
  keepAwake: boolean;
};
const defaults: Preferences = {
  language: "en",
  theme: "light",
  bodyModel: "male",
  sound: true,
  vibration: true,
  notifications: false,
  restSeconds: 120,
  keepAwake: false,
};
const Context = createContext<
  Preferences & {
    ready: boolean;
    reducedMotion: boolean;
    colors: Record<keyof typeof lightTheme.colors, string>;
    update: (value: Partial<Preferences>) => void;
  }
>({
  ...defaults,
  ready: false,
  reducedMotion: false,
  colors: lightTheme.colors,
  update: () => {},
});
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);
  const [prefs, setPrefs] = useState(defaults),
    [ready, setReady] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem("native-preferences")
      .then((value) => {
        if (value) {
          const saved = JSON.parse(value);
          const next = {
            ...defaults,
            ...saved,
            language: saved.language === "sv" ? "sv" : "en",
            theme: saved.theme === "dark" ? "dark" : "light",
          };
          setLanguage(next.language);
          setPrefs(next);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    let alive = true;
    setPrefs((previous) => ({
      ...previous,
      restSeconds: 120,
      notifications: false,
      sound: true,
      vibration: true,
    }));
    if (user)
      void AsyncStorage.getItem(`native-account-preferences:${user._id}`)
        .then((value) => {
          if (alive && value) {
            const saved = JSON.parse(value);
            setPrefs((previous) => ({
              ...previous,
              restSeconds:
                Number.isInteger(saved.restSeconds) &&
                saved.restSeconds >= 1 &&
                saved.restSeconds <= 86400
                  ? saved.restSeconds
                  : 120,
              sound: saved.sound !== false,
              vibration: saved.vibration !== false,
              notifications: saved.notifications === true,
            }));
          }
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?._id]);
  function update(value: Partial<Preferences>) {
    setPrefs((previous) => {
      const next = { ...previous, ...value };
      setLanguage(next.language);
      void AsyncStorage.setItem(
        "native-preferences",
        JSON.stringify({
          language: next.language,
          theme: next.theme,
          bodyModel: next.bodyModel,
          keepAwake: next.keepAwake,
        }),
      ).catch(() => {});
      if (user)
        void AsyncStorage.setItem(
          `native-account-preferences:${user._id}`,
          JSON.stringify({
            restSeconds: next.restSeconds,
            notifications: next.notifications,
            sound: next.sound,
            vibration: next.vibration,
          }),
        ).catch(() => {});
      return next;
    });
  }
  return (
    <Context.Provider
      value={{
        ...prefs,
        reducedMotion,
        ready,
        colors: prefs.theme === "dark" ? darkTheme.colors : lightTheme.colors,
        update,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
