import { Request, Response, NextFunction } from "express";
import * as workoutDraftService from '../services/workoutDraftService';
import { UnauthorizedError } from "../errors/AppError";

function getUserId(req: Request, res: Response): string | null {
    if (!req.user?.id) {
        throw new UnauthorizedError("Unauthorized");
    }

    return req.user.id;
}


export async function createWorkoutDraft(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.createWorkoutDraft(
            req.body,
            userId,
        );

        res.status(201).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function getCurrentWorkoutDraft(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.getCurrentWorkoutDraft(userId);

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function getWorkoutDraftById(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.getWorkoutDraftById(
            req.params.draftId,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}


export async function updateWorkoutDraftMuscleGroups(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.updateWorkoutDraftMuscleGroups(
            req.params.draftId,
            req.body,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function updateWorkoutDraftExercises(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.updateWorkoutDraftExercises(
            req.params.draftId,
            req.body,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function startWorkoutDraft(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.startWorkoutDraft(
            req.params.draftId,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function updateWorkoutDraftSets(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.updateWorkoutDraftSets(
            req.params.draftId,
            req.body,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function completeWorkoutDraft(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const workoutSession = await workoutDraftService.completeWorkoutDraft(
            req.params.draftId,
            userId,
        );

        res.status(201).json(workoutSession);
    } catch (error) {
        next(error);
    }
}

export async function abandonWorkoutDraft(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req, res);

        if (!userId) {
            return;
        }

        const draft = await workoutDraftService.abandonWorkoutDraft(
            req.params.draftId,
            userId,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}

export async function reorderWorkoutDraftExercises(
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const draft = await workoutDraftService.reorderWorkoutDraftExercises(
            req.params.draftId,
            req.body,
            req.user.id,
        );

        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
}
