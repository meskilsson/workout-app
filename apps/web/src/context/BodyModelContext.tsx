import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_BODY_MODEL_GENDER, isBodyModelGender, type BodyModelGender } from "@workout-app/shared";
import type { ReactNode } from "react";

type BodyModelContextValue = {
    gender: BodyModelGender;
    setGender: (gender: BodyModelGender) => void;
}

const BodyModelContext = createContext<BodyModelContextValue | undefined>(undefined);

const BODY_MODEL_STORAGE_KEY = "body_model_gender";

export function BodyModelProvider({ children }: { children: ReactNode }) {
    const [gender, setGenderState] = useState<BodyModelGender>(() => {
        const storedGender = localStorage.getItem(BODY_MODEL_STORAGE_KEY);

        if (isBodyModelGender(storedGender)) {
            return storedGender;
        }

        return DEFAULT_BODY_MODEL_GENDER;
    });

    function setGender(newGender: BodyModelGender) {
        setGenderState(newGender);
        localStorage.setItem(BODY_MODEL_STORAGE_KEY, newGender);
    }

    const value = useMemo(
        () => ({
            gender,
            setGender,
        }),
        [gender],
    );

    return (
        <BodyModelContext.Provider value={value}>{children}</BodyModelContext.Provider>
    )
}

export function useBodyModel() {
    const context = useContext(BodyModelContext);

    if (!context) {
        throw new Error("useBodyModel must be used inside BodyModelProvider");
    }

    return context;
}