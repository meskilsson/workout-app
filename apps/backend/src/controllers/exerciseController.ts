import { Request, Response, NextFunction } from "express";
import * as exerciseService from "../services/exerciseService";

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export async function createExercise(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            const error = new Error("Unauthorized") as Error & {
                statusCode?: number;
            };
            error.statusCode = 401;
            throw error;
        }

        const exercise = await exerciseService.createExercise(req.body, req.user.id);
        res.status(201).json(exercise);
    } catch (error) {
        next(error);
    }
}