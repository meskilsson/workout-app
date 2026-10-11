import { ApiRequestError } from "./parseJsonResponse";
import { UserFacingError } from "./UserFacingError";

export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export function validationMessage(control: FormControl): string {
    const labelElement = control.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
    labelElement?.querySelectorAll("input, select, textarea, [role=alert]").forEach(element => element.remove());
    const label = labelElement?.textContent?.replace(/\s*\*\s*$/, "").trim() || control.getAttribute("aria-label") || "This field";
    const value = control.type === "password" ? control.value : control.value.trim();
    if (control.validity.badInput) return "Enter a valid number.";
    if (control.required && !value) return `${label} is required.`;
    if (control.validity.typeMismatch) return control.type === "email" ? "Enter a valid email address, such as name@example.com." : "Enter a valid URL.";
    if ("minLength" in control && value && control.minLength > 0 && value.length < control.minLength) return `Use at least ${control.minLength} characters.`;
    if ("maxLength" in control && control.maxLength > 0 && value.length > control.maxLength) return `Use no more than ${control.maxLength} characters.`;
    if (control.validity.rangeUnderflow && "min" in control) return `Enter a value of ${control.min} or more.`;
    if (control.validity.rangeOverflow && "max" in control) return `Enter a value of ${control.max} or less.`;
    if (control.validity.stepMismatch) return "step" in control && control.step === "1" ? "Enter a whole number." : `Use increments of ${"step" in control && control.step ? control.step : "1"}.`;
    if (control.validity.patternMismatch) return control.dataset.validationHint || "Use the requested format.";
    if (control.name === "confirmPassword") {
        const password = control.form?.elements.namedItem("newPassword");
        if (password instanceof HTMLInputElement && control.value !== password.value) return "New passwords do not match. Enter the same password again.";
    }
    return control.dataset.validationError || (control.validity.valid ? "" : "Check this value and try again.");
}

export function apiFieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiRequestError) || error.status >= 500) return {};
    const data = error.data;
    if (!data || typeof data !== "object" || !("errors" in data) || !Array.isArray(data.errors)) return {};
    return Object.fromEntries(data.errors.flatMap(issue => {
        if (!issue || typeof issue !== "object" || typeof issue.message !== "string") return [];
        const field = issue.field ?? issue.path;
        const path = Array.isArray(field) ? field.join(".") : field;
        return typeof path === "string" && path && issue.message.trim() ? [[path, issue.message]] : [];
    }));
}

// Keep network exceptions and internal server details out of the interface.
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
    if (error instanceof ApiRequestError || error instanceof UserFacingError) return error.message;
    if (error instanceof TypeError || (error instanceof Error && /network|fetch|timeout|timed out|abort/i.test(error.message))) return "Unable to connect. Check your connection and try again.";
    return fallback;
}

export function reportFormError(form: HTMLFormElement, error: unknown): boolean {
    const event = new CustomEvent("form-field-errors", { detail: apiFieldErrors(error), cancelable: true });
    form.dispatchEvent(event);
    return event.defaultPrevented;
}
