import { createContext, useContext, useLayoutEffect } from "react";
export const LoadingRegistration = createContext<(() => () => void) | null>(null);
export function useLoadingHandoff(enabled = true) {
    const register = useContext(LoadingRegistration);
    useLayoutEffect(() => enabled ? register?.() : undefined, [enabled, register]);
}
