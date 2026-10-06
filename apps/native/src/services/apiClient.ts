const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
}

type ApiFetchOptions = RequestInit & {
    token?: string | null;
}

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
): Promise<T> {
    const { token, headers, ...restOptions } = options;

    const response = await fetch(`${API_URL}${path}`, {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}