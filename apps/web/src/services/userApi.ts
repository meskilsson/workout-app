import type { UpdateUserBody } from "@workout-app/shared";
import { parseJsonResponse } from "../utils/parseJsonResponse";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type UserResponse = {
    _id: string;
    name: string;
    email: string;
    username: string;
    profileImage: string | null;
    role: "user" | "admin";
};

type MessageResponse = {
    message: string;
};

export async function getAllUsersRequest(): Promise<UserResponse[]> {
    const response = await fetch(`${API_URL}/api/users`, {
        credentials: "include",
    });

    return parseJsonResponse<UserResponse[]>(
        response,
        "Failed to get users",
    );
}

export async function getUserByIdRequest(id: string): Promise<UserResponse> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
        credentials: "include",
    });

    return parseJsonResponse<UserResponse>(
        response,
        "Failed to get user",
    );
}

export async function updateUserRequest(
    id: string,
    userData: UpdateUserBody,
): Promise<UserResponse> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    return parseJsonResponse<UserResponse>(
        response,
        "Failed to update user",
    );
}

export async function changePasswordRequest(
    id: string,
    passwordData: {
        currentPassword: string;
        newPassword: string;
    },
): Promise<MessageResponse> {
    const response = await fetch(`${API_URL}/api/users/${id}/password`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
    });

    return parseJsonResponse<MessageResponse>(
        response,
        "Failed to update password",
    );
}

export async function deleteUserRequest(userId: string): Promise<MessageResponse> {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
    });

    return parseJsonResponse<MessageResponse>(
        response,
        "Failed to delete account",
    );
}