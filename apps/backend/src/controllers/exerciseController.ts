import { Request, Response, NextFunction } from "express";
import * as exerciseService from "../services/exerciseService";

export async function createExercise(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const exercise = await exerciseService.createExercise(req.body, req.user.id);
        res.status(201).json(exercise);
    } catch (error) {
        next(error);
    }
}

export async function getPublicExercises(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const exercises = await exerciseService.getPublicExercises();
        res.status(200).json(exercises);
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
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const exercises = await exerciseService.getExerciseLibrary(req.user.id);
        res.status(200).json(exercises);
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
            res.status(401).json({ message: "Unauthorized" });
            return;
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
            res.status(401).json({ message: "Unauthorized" });
            return;
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