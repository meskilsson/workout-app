import { apiFetch } from "./apiClient";

export type User = {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: "user" | "admin";
};

type LoginResponse = {
    user: User;
    token: string;
};

type MeResponse = {
    user: User;
};

export async function loginRequest(email: string, password: string) {
    return apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });
}

export async function getMeRequest(token: string) {
    return apiFetch<MeResponse>("/api/auth/me", {
        method: "GET",
        token,
    });
}