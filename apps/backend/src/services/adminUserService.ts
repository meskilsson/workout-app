import mongoose, { Schema, model, Types } from "mongoose";
import User from "../models/User";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors/AppError";

// All changes that can remove an active admin serialize on this document.
const AdminLock = model("AdminLock", new Schema({ _id: String, revision: Number }));

export function checkAdminRemoval(role: string, active: boolean, removing: boolean, count: number) {
  if (role === "admin" && active && removing && count <= 1) {
    throw new ConflictError("The last active admin cannot be deactivated or demoted");
  }
}

export async function manageUser(id: string, actorId: string, input: { role?: "user" | "admin"; active?: boolean }, selfDeletion = false) {
  if (id === actorId && !selfDeletion) throw new ForbiddenError("Use another admin to change your own role or account status");
  try {
    await AdminLock.updateOne({ _id: "active-admins" }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  } catch (error) {
    // Another first-time request may have inserted this same lock concurrently.
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
  }
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      await AdminLock.updateOne({ _id: "active-admins" }, { $inc: { revision: 1 } }, { session });
      const actor = await User.findOne({ _id: actorId, deletedAt: null }).session(session);
      if (!actor || (!selfDeletion && actor.role !== "admin")) throw new ForbiddenError("Admin access required");
      const user = await User.findById(id).session(session);
      if (!user) throw new NotFoundError("User not found");
      if (input.active === false && user.deletedAt) throw new ConflictError("Account is already inactive");
      const count = await User.countDocuments({ role: "admin", deletedAt: null }).session(session);
      checkAdminRemoval(user.role, !user.deletedAt, input.active === false || input.role === "user", count);
      if (input.role !== undefined) user.role = input.role;
      if (input.active === false) {
        user.deletedAt = new Date();
        user.deletedBy = new Types.ObjectId(actorId);
        user.deleteReason = selfDeletion ? "User requested account deletion" : "Account deactivated by admin";
      } else if (input.active === true) {
        user.deletedAt = null; user.deletedBy = null; user.deleteReason = null;
      }
      await user.save({ session });
      return { _id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, deletedAt: user.deletedAt };
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 20) {
      throw new ConflictError("Account changes require a MongoDB replica set. Configure the database before changing roles or account status.");
    }
    throw error;
  } finally { await session.endSession(); }
}
