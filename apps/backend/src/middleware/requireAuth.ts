import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import User from "../models/User";

function getTokenFromRequest(req: Request): string | null {
    const cookieToken = req.cookies?.token;

    if (cookieToken) {
        return cookieToken;
    }

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.replace("Bearer ", "");
    }

    return null;
}

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (user.deletedAt) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        if (!(error instanceof JsonWebTokenError)) { next(error); return; }
        res.status(401).json({ code: error instanceof TokenExpiredError ? "ACCESS_TOKEN_EXPIRED" : "UNAUTHORIZED", message: "Unauthorized" });
    }
}