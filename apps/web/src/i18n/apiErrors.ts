import i18n, { t, translateMessage, isAppMessage } from ".";

const codes: Record<string, string> = {
    INVALID_CREDENTIALS: "invalidCredentials", UNAUTHORIZED: "unauthorized", SESSION_EXPIRED: "unauthorized",
    FORBIDDEN: "forbidden", EMAIL_TAKEN: "emailTaken", USERNAME_TAKEN: "usernameTaken",
    DUPLICATE_VALUE: "duplicate", invalid_type: "checkField", too_small: "checkField",
    too_big: "checkField", invalid_format: "checkField", invalid_string: "checkField", custom: "checkField",
};
// This backend mostly returns messages rather than codes. Map only known messages.
const messages: Record<string, string> = {
    "Invalid email or password": "invalidCredentials", "Unauthorized": "unauthorized", "Forbidden": "forbidden",
    "Current password is incorrect": "currentPassword", "Email or username already in use": "accountTaken",
    "Email is already in use": "emailTaken", "Username is already in use": "usernameTaken",
    "A record with that value already exists": "duplicate", "Invalid ID format": "invalidId",
};
export function apiErrorMessage(data: unknown, message: string, fallback: string): string {
    const code = data && typeof data === "object" && "code" in data ? data.code : undefined;
    const key = typeof code === "string" ? codes[code] : undefined;
    const known = key ?? messages[message.trim()];
    if (known) return t(`errors.${known}`);
    const translated = translateMessage(message);
    if (isAppMessage(message) || translated !== message || i18n.resolvedLanguage !== "sv") return translated;
    return translateMessage(fallback);
}
