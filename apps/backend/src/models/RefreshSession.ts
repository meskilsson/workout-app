import { Schema, model } from "mongoose";

const refreshSessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
});

export default model("RefreshSession", refreshSessionSchema);
