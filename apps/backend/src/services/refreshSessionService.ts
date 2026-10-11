import { createHash, randomBytes } from "node:crypto";
import RefreshSession from "../models/RefreshSession";
import User from "../models/User";

export const refreshLifetime = 30 * 24 * 60 * 60 * 1000;
export const hashRefreshToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("hex");

export async function createRefreshSession(userId: string) {
    const token = newToken();
    await RefreshSession.create({ userId, tokenHash: hashRefreshToken(token), expiresAt: new Date(Date.now() + refreshLifetime) });
    return token;
}

export async function rotateRefreshSession(token: string) {
    const tokenHash = hashRefreshToken(token);
    const session = await RefreshSession.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!session) return null;
    // Check the account before consuming the token: database failures must remain retryable.
    const user = await User.findById(session.userId);
    if (!user || user.deletedAt) {
        await RefreshSession.deleteOne({ _id: session._id });
        return null;
    }
    const nextToken = newToken();
    const rotated = await RefreshSession.findOneAndUpdate(
        { _id: session._id, tokenHash, expiresAt: { $gt: new Date() } },
        { $set: { tokenHash: hashRefreshToken(nextToken) } },
        { new: true },
    );
    return rotated ? { user, token: nextToken, expiresAt: rotated.expiresAt } : null;
}

export async function revokeRefreshSession(token: unknown) {
    if (typeof token === "string") await RefreshSession.deleteOne({ tokenHash: hashRefreshToken(token) });
}
