import { Request, Response, NextFunction } from "express";
import * as exerciseService from "../services/exerciseService";
import { UnauthorizedError } from "../errors/AppError";
import { parseExerciseQuery } from "../utils/parseExerciseQuery";

export async function createExercise(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const exercise = await exerciseService.createExercise(req.body, req.user.id);
        res.status(201).json(exercise);
    } catch (error) {
        next(error);
    }
}

export async function getPublicExercises(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const options = parseExerciseQuery(req);
        const result = await exerciseService.getPublicExercises(options);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getExerciseLibrary(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const options = parseExerciseQuery(req);

        const result = await exerciseService.getExerciseLibrary(
            req.user.id,
            options,
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getExerciseById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const exercise = await exerciseService.getExerciseById(req.params.id);
        res.status(200).json(exercise);
    } catch (error) {
        next(error);
    }
}

export async function updateExercise(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const exercise = await exerciseService.updateExercise(
            req.params.id,
            req.body,
            req.user.id,
        );

        res.status(200).json(exercise)
    } catch (error) {
        next(error);
    }
}

export async function deleteExercise(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const result = await exerciseService.deleteExercise(
            req.params.id,
            req.user.id,
        );

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}