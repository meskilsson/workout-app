import { Request, Response, NextFunction } from "express";

type AppError = Error & {
  statusCode?: number;
};

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Server error",
  });
}
