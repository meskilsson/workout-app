import { createContext, useContext, type ReactNode } from "react";
import { secondsToMilliseconds } from "./restTimer.utils";
import { useRestTimer } from "./useRestTimer";

type RestTimerContextValue = ReturnType<typeof useRestTimer>;

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

type RestTimerProviderProps = {
    children: ReactNode;
    durationMs?: number;
};

export function RestTimerProvider({
    children,
    durationMs = secondsToMilliseconds(60),
}: RestTimerProviderProps) {
    const timer = useRestTimer(durationMs);

    return (
        <RestTimerContext.Provider value={timer}>{children}</RestTimerContext.Provider>
    )
}

export function useRestTimerControls() {
    const context = useContext(RestTimerContext);

    if (!context) {
        throw new Error("useRestTimerControls must be used inside RestTimerProvider");
    }

    return context;
}