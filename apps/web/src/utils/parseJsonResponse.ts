import { t } from "../i18n";
import { apiErrorMessage } from "../i18n/apiErrors";
type ApiValidationError = {
    field?: string | string[];
    path?: string | string[];
    message?: string;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Array<ApiValidationError | string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeField(field: unknown): string | undefined {
    if (typeof field === "string") {
        return field;
    }

    if (Array.isArray(field)) {
        return field.map(String).join(".");
    }

    return undefined;
}

function formatValidationError(error: unknown): string | null {
    if (!isRecord(error) && typeof error !== "string") return null;
    if (typeof error === "string") {
        return error;
    }

    const field = normalizeField(error.field ?? error.path);
    const message = typeof error.message === "string" ? error.message : undefined;

    if (field && message) {
        return `${field}: ${message}`;
    }

    if (message) {
        return message;
    }

    return null;
}

function getErrorMessage(data: unknown, fallbackMessage: string): string {
    if (typeof data === "string") return fallbackMessage;

    if (!isRecord(data)) {
        return fallbackMessage;
    }

    const errorData = data as ApiErrorResponse;

    const validationMessage = (Array.isArray(errorData.errors) ? errorData.errors : [])
        .map(formatValidationError)
        .filter((message): message is string => Boolean(message))
        .join("\n");

    if (validationMessage) {
        return validationMessage;
    }

    if (typeof errorData.message === "string" && errorData.message.trim()) {
        return errorData.message;
    }

    return fallbackMessage;
}

export class ApiRequestError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = "ApiRequestError";
        this.status = status;
        this.data = data;
    }
}

export async function parseJsonResponse<T>(
    response: Response,
    fallbackMessage: string,
): Promise<T> {
    const rawText = await response.text();

    let data: unknown = null;

    if (rawText.trim()) {
        try {
            data = JSON.parse(rawText);
        } catch {
            data = rawText;
            if (response.ok) throw new ApiRequestError(fallbackMessage, response.status, data);
        }
    }

    if (!response.ok) {
        throw new ApiRequestError(
            response.status >= 500 ? t("parseJsonResponse.theServerCouldNotCompleteYourRequestPleaseTry") : apiErrorMessage(data, getErrorMessage(data, fallbackMessage), fallbackMessage),
            response.status,
            data,
        );
    }

    return data as T;
}
