import { parseJsonResponse } from "../utils/parseJsonResponse";

type SignupInput = {
    name: string;
    email: string;
    username: string;
    password: string;
};

type LoginInput = {
    email: string;
    password: string;
};

export type User = {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: "user" | "admin";
    profileImage?: string | null;
};

type AuthResponse = {
    user: User;
};

type MessageResponse = {
    message: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function signupRequest(signupData: SignupInput): Promise<User> {
    const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(signupData),
    });

    return parseJsonResponse<User>(response, "Signup failed");
}

export async function loginRequest(loginData: LoginInput): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
    });

    const data = await parseJsonResponse<AuthResponse>(
        response,
        "Login failed",
    );

    return data.user;
}

export async function getMeRequest(signal?: AbortSignal): Promise<User | null> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
        signal,
        method: "GET",
        credentials: "include",
    });

    if (response.status === 401) {
        return null;
    }

    const data = await parseJsonResponse<AuthResponse>(
        response,
        "Failed to fetch current user",
    );

    return data.user;
}

export async function logoutRequest(): Promise<MessageResponse> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    return parseJsonResponse<MessageResponse>(
        response,
        "Logout failed",
    );
}
