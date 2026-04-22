import { Request, Response, NextFunction } from "express";

export function requireRole(...allowedRoles: Array<"user" | "admin">) {
    return function (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized " });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        next();
    }
}