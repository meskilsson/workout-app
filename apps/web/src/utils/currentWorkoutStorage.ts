import type { CurrentWorkoutStorage } from "@workout-app/shared/currentWorkoutContext";

export const webCurrentWorkoutStorage: CurrentWorkoutStorage = {
    getItem: async (key) => {
        return localStorage.getItem(key);
    },

    setItem: async (key, value) => {
        localStorage.setItem(key, value);
    },

    removeItem: async (key) => {
        localStorage.removeItem(key);
    },
};