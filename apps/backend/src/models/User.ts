import { Schema, model } from "mongoose";

export interface IUser {
  name: string;
  age?: number;
  address?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", userSchema);

export default User;
