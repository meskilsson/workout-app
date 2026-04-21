import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { signAccessToken } from "../utils/jwt";
import User from "../models/User";

export async function loginUser(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const user = await authService.loginUser(req.body);

        if (!user) {
            const error = new Error("Invalid email or password") as Error & {
                statusCode?: number;
            };
            error.statusCode = 401;
            throw error;
        }

        const token = signAccessToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24,
        });

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

export async function getMe(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

export async function logoutUser(
    _req: Request,
    res: Response,
): Promise<void> {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.status(200).json({ message: "Logged out" });
}