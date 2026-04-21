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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function signupRequest(signupData: SignupInput) {
    const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Signup failed");
    }

    return data;
}

export async function loginRequest(loginData: LoginInput) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data.user;
}

export async function getMeRequest() {
    const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
    });

    if (response.status === 401) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch current user");
    }

    return data.user;
}

export async function logoutRequest() {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Logout failed");
    }

    return data;
}