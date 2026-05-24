import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import type { IdParams } from "../types/errors";

import type { ChangePasswordBody, UpdateUserBody } from "@workout-app/shared";
import { NotFoundError, UnauthorizedError } from "../errors/AppError";


const isProduction = process.env.NODE_ENV === "production";

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request<IdParams, unknown, UpdateUserBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError("Unauthorized");
    }

    const deletedUser = await userService.deleteUser(
      req.params.id,
      req.user.id,
    );

    if (req.user.id === req.params.id) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });
    }

    res.status(200).json(deletedUser);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request<IdParams, unknown, ChangePasswordBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new NotFoundError("Current password and new password are required");
    }

    const result = await userService.changePasswordService(
      id,
      currentPassword,
      newPassword
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}