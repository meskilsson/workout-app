import { t } from "../i18n";
import { apiErrorMessage } from "../i18n/apiErrors";
import { ApiRequestError } from "./parseJsonResponse";
import { UserFacingError } from "./UserFacingError";

export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export function validationMessage(control: FormControl): string {
    const labelElement = control.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
    labelElement?.querySelectorAll("input, select, textarea, [role=alert]").forEach(element => element.remove());
    const label = labelElement?.textContent?.replace(/\s*\*\s*$/, "").trim() || control.getAttribute("aria-label") || t("common.thisField");
    const value = control.type === "password" ? control.value : control.value.trim();
    if (control.validity.badInput) return t("formValidation.enterAValidNumber");
    if (control.required && !value) return t("formValidation.valueIsRequired", { value0: label });
    if (control.validity.typeMismatch) return control.type === "email" ? t("formValidation.enterAValidEmailAddressSuchAsNameExample") : t("formValidation.enterAValidURL");
    if ("minLength" in control && value && control.minLength > 0 && value.length < control.minLength) return t("formValidation.useAtLeastValueCharacters", { value0: control.minLength });
    if ("maxLength" in control && control.maxLength > 0 && value.length > control.maxLength) return t("formValidation.useNoMoreThanValueCharacters", { value0: control.maxLength });
    if (control.validity.rangeUnderflow && "min" in control) return t("formValidation.enterAValueOfValueOrMore", { value0: control.min });
    if (control.validity.rangeOverflow && "max" in control) return t("formValidation.enterAValueOfValueOrLess", { value0: control.max });
    if (control.validity.stepMismatch) return "step" in control && control.step === "1" ? t("formValidation.enterAWholeNumber") : t("formValidation.useIncrementsOfValue", { value0: "step" in control && control.step ? control.step : "1" });
    if (control.validity.patternMismatch) return control.dataset.validationHint || t("common.requestedFormat");
    if (control.name === "confirmPassword") {
        const password = control.form?.elements.namedItem("newPassword");
        if (password instanceof HTMLInputElement && control.value !== password.value) return t("formValidation.newPasswordsDoNotMatchEnterTheSamePassword");
    }
    return control.dataset.validationError || (control.validity.valid ? "" : t("formValidation.checkThisValueAndTryAgain"));
}

export function apiFieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiRequestError) || error.status >= 500) return {};
    const data = error.data;
    if (!data || typeof data !== "object" || !("errors" in data) || !Array.isArray(data.errors)) return {};
    return Object.fromEntries(data.errors.flatMap(issue => {
        if (!issue || typeof issue !== "object" || (typeof issue.message !== "string" && typeof issue.code !== "string")) return [];
        const field = issue.field ?? issue.path;
        const path = Array.isArray(field) ? field.join(".") : field;
        const message = typeof issue.message === "string" ? issue.message : t("errors.checkField");
        return typeof path === "string" && path && message.trim() ? [[path, apiErrorMessage(issue, message, t("errors.checkField"))]] : [];
    }));
}

// Keep network exceptions and internal server details out of the interface.
export function friendlyError(error: unknown, fallback = t("formValidation.somethingWentWrongPleaseTryAgain")): string {
    if (error instanceof ApiRequestError) return apiErrorMessage(error.data, error.message, fallback);
    if (error instanceof UserFacingError) return error.message;
    if (error instanceof TypeError || (error instanceof Error && /network|fetch|timeout|timed out|abort/i.test(error.message))) return t("formValidation.unableToConnectCheckYourConnectionAndTryAgain");
    return fallback;
}

export function reportFormError(form: HTMLFormElement, error: unknown): boolean {
    const event = new CustomEvent("form-field-errors", { detail: apiFieldErrors(error), cancelable: true });
    form.dispatchEvent(event);
    return event.defaultPrevented;
}
