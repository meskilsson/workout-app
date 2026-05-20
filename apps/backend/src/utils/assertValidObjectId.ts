import { Types } from "mongoose";
import { ValidationError } from "../errors/AppError";

export function assertValidObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid ${label}`);
    }
}