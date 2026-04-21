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