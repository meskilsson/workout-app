import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    type ReactElement,
} from "react";

export type CurrentWorkoutStorage = {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
};

type CurrentWorkoutContextValue = {
    currentWorkoutId: string | null;
    setCurrentWorkoutId: Dispatch<SetStateAction<string | null>>;
};

type CurrentWorkoutProviderProps = {
    children: ReactNode;
    storage: CurrentWorkoutStorage;
};

const CURRENT_WORKOUT_STORAGE_KEY = "currentWorkoutId";

const CurrentWorkoutContext = createContext<CurrentWorkoutContextValue | null>(null);

export function CurrentWorkoutProvider({
    children,
    storage,
}: CurrentWorkoutProviderProps): ReactElement {
    const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function hydrateCurrentWorkout(): Promise<void> {
            const savedWorkoutId = await storage.getItem(CURRENT_WORKOUT_STORAGE_KEY);

            if (isMounted) {
                setCurrentWorkoutId(savedWorkoutId);
                setHasHydrated(true);
            }
        }

        void hydrateCurrentWorkout();

        return () => {
            isMounted = false;
        };
    }, [storage]);

    useEffect(() => {
        if (!hasHydrated) return;

        async function persistCurrentWorkout(): Promise<void> {
            if (currentWorkoutId) {
                await storage.setItem(CURRENT_WORKOUT_STORAGE_KEY, currentWorkoutId);
            } else {
                await storage.removeItem(CURRENT_WORKOUT_STORAGE_KEY);
            }
        }

        void persistCurrentWorkout();
    }, [currentWorkoutId, hasHydrated, storage]);

    const value = useMemo<CurrentWorkoutContextValue>(
        () => ({
            currentWorkoutId,
            setCurrentWorkoutId,
        }),
        [currentWorkoutId],
    );

    return (
        <CurrentWorkoutContext.Provider value={value}>
            {children}
        </CurrentWorkoutContext.Provider>
    );
}

export function useCurrentWorkout(): CurrentWorkoutContextValue {
    const context = useContext(CurrentWorkoutContext);

    if (!context) {
        throw new Error("useCurrentWorkout must be used inside CurrentWorkoutProvider");
    }

    return context;
}