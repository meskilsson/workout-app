export async function parseJsonResponse<T>(
    response: Response,
    fallbackMessage: string,
): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || fallbackMessage);
    }

    return data;
}