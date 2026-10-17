import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { signAccessToken } from "../utils/jwt";
import User from "../models/User";
import { createRefreshSession, rotateRefreshSession, revokeRefreshSession, refreshLifetime } from "../services/refreshSessionService";
import { UnauthorizedError } from "../errors/AppError";
import RefreshSession from "../models/RefreshSession";
import { hashRefreshToken } from "../services/refreshSessionService";
import { disableDevicePush } from "../services/timerPushService";



const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" as const : "lax" as const };
function clearAuthCookies(res: Response) {
    res.clearCookie("token", { ...cookieOptions, path: "/" });
    res.clearCookie("refreshToken", { ...cookieOptions, path: "/api/auth" });
}
function setAccessCookie(res: Response, user: { _id: { toString(): string }; email: string; role: "user" | "admin" }) {
    const token = signAccessToken({ id: user._id.toString(), email: user.email, role: user.role });
    res.cookie("token", token, { ...cookieOptions, path: "/", maxAge: 24 * 60 * 60 * 1000 });
    res.setHeader("Cache-Control", "no-store");
    return token;
}

export async function loginUser(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {


    try {
        const user = await authService.loginUser(req.body);

        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const refreshToken = await createRefreshSession(user._id.toString());
        await revokeRefreshSession(req.cookies?.refreshToken);
        const token = setAccessCookie(res, user);
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, path: "/api/auth", maxAge: refreshLifetime });

        res.status(200).json({ user, token });
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
            throw new UnauthorizedError("Unauthorized");
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            throw new UnauthorizedError("Unauthorized");
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

export async function refreshUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    // A cross-origin HTML form cannot supply this header; CORS restricts permitted origins.
    if (req.get("X-Auth-Refresh") !== "1") {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    try {
        const token = req.cookies?.refreshToken;
        const session = typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
            ? await rotateRefreshSession(token) : null;
        if (!session) {
            clearAuthCookies(res);
            res.status(401).json({ code: "SESSION_EXPIRED", message: "Unauthorized" });
            return;
        }
        setAccessCookie(res, session.user);
        res.cookie("refreshToken", session.token, { ...cookieOptions, path: "/api/auth", expires: session.expiresAt });
        res.status(200).json({ user: session.user });
    } catch (error) { next(error); }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const deviceId = req.get("X-Workout-Device");
        if (deviceId && /^[a-f\d-]{36}$/i.test(deviceId) && typeof req.cookies?.refreshToken === "string") {
            const session = await RefreshSession.findOne({ tokenHash: hashRefreshToken(req.cookies.refreshToken) });
            if (session) await disableDevicePush(session.userId.toString(), deviceId);
        }
        await revokeRefreshSession(req.cookies?.refreshToken);
        clearAuthCookies(res);
        res.status(200).json({ message: "Logged out" });
    } catch (error) { next(error); }
}
