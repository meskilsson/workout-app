import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";

type IdParams = {
  id: string;
};

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
