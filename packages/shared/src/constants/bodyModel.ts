export const BODY_MODEL_GENDERS = ["male", "female"] as const;

export type BodyModelGender = (typeof BODY_MODEL_GENDERS)[number];

export const DEFAULT_BODY_MODEL_GENDER: BodyModelGender = "male";

export function isBodyModelGender(
    value: string | null,
): value is BodyModelGender {
    return BODY_MODEL_GENDERS.includes(value as BodyModelGender);
}