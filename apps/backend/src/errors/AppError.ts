export type AppErrorDetail = {
    location?: string;
    field?: string;
    message: string;
};

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors: AppErrorDetail[];

    constructor(
        message: string,
        statusCode: number,
        errors: AppErrorDetail[] = [],
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;

        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation error", errors: AppErrorDetail[] = []) {
        super(message, 400, errors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", errors: AppErrorDetail[] = []) {
        super(message, 401, errors);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", errors: AppErrorDetail[] = []) {
        super(message, 403, errors);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not found", errors: AppErrorDetail[] = []) {
        super(message, 404, errors);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict", errors: AppErrorDetail[] = []) {
        super(message, 409, errors);
    }
}