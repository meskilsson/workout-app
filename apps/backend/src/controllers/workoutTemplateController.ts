import { Request, Response, NextFunction } from "express";
import * as workoutTemplateService from '../services/workoutTemplateService';

import { UnauthorizedError } from "../errors/AppError";

import type { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput, WorkoutTemplateIdParams } from "../schemas/workoutTemplateSchemas";

export async function getPublicWorkoutTemplates(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {

        const templates = await workoutTemplateService.getPublicWorkoutTemplates();

        res.status(200).json(templates);

    } catch (error) {
        next(error);
    }
}

export async function getPublicWorkoutTemplateById(
    req: Request<WorkoutTemplateIdParams>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {

        const template = await workoutTemplateService.getPublicWorkoutTemplateById(req.params.templateId);

        res.status(200).json(template);

    } catch (error) {
        next(error);
    }
}

export async function getMyWorkoutTemplates(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const templates = await workoutTemplateService.getMyWorkoutTemplates(
            req.user.id,
        );

        res.status(200).json(templates);
    } catch (error) {
        next(error);
    }
}

export async function getMyWorkoutTemplateById(
    req: Request<WorkoutTemplateIdParams>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        console.log("REQ USER ID:", req.user?.id);
        console.log("TEMPLATE ID:", req.params.templateId);

        const template =
            await workoutTemplateService.getMyWorkoutTemplateById(
                req.params.templateId,
                req.user.id,
            );


        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
}

export async function createWorkoutTemplate(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const body = req.validatedBody as CreateWorkoutTemplateInput;

        const template = await workoutTemplateService.createWorkoutTemplate(
            body,
            req.user.id,
        );

        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
}

export async function updateWorkoutTemplate(
    req: Request<WorkoutTemplateIdParams>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const body = req.validatedBody as UpdateWorkoutTemplateInput;

        const template = await workoutTemplateService.updateWorkoutTemplate(
            req.params.templateId,
            req.user.id,
            body,
        );

        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
}

export async function deleteWorkoutTemplate(
    req: Request<WorkoutTemplateIdParams>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const result = await workoutTemplateService.deleteWorkoutTemplate(
            req.params.templateId,
            req.user.id,
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function startWorkoutFromTemplate(
    req: Request<WorkoutTemplateIdParams>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const draft = await workoutTemplateService.startWorkoutFromTemplate(
            req.params.templateId,
            req.user.id,
        );

        res.status(201).json(draft);
    } catch (error) {
        next(error);
    }
}