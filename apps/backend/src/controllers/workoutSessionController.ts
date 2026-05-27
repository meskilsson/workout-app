import { Request, Response, NextFunction } from "express";
import * as workoutSessionService from '../services/workoutSessionService';
import { UnauthorizedError, ValidationError } from "../errors/AppError";


export async function createWorkoutSession(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const workoutSession = await workoutSessionService.createWorkoutSession(
            req.body,
            req.user.id,
        );

        res.status(201).json(workoutSession);
    } catch (error) {
        next(error);
    }
}

export async function getMyWorkoutSessions(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const session = await workoutSessionService.getMyWorkoutSessions(
            req.user.id,
        );

        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
}

export async function getWorkoutSessionById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const session = await workoutSessionService.getWorkoutSessionById(
            req.params.id,
            req.user.id
        );

        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
}

export async function repeatWorkoutSession(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            throw new UnauthorizedError("Unauthorized");
        }

        if (!id) {
            throw new ValidationError("Missing workout session id");
        }

        const draft = await workoutSessionService.repeatWorkoutSession(
            id,
            userId,
        );

        res.status(201).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function deleteWorkoutSession(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            throw new UnauthorizedError("Unauthorized");
        }

        if (!id) {
            throw new ValidationError("Missing workout session id");
        }

        const session = await workoutSessionService.deleteWorkoutSession(
            id,
            userId,
        );

        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
}