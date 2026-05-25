import User from "../models/User";
import bcrypt from 'bcrypt';
import type { UserRole } from "@workout-app/shared";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";
import { Types } from "mongoose";


interface CreateUserInput {
  name: string;
  email: string;
  username: string;
  password: string;
  profileImage?: string | null;
};

interface UpdatedUserInput {
  name?: string;
  email?: string;
  username?: string;
  role?: UserRole;
}


export async function createUser(userData: CreateUserInput) {

  if (!userData?.name || !userData?.email || !userData?.username || !userData?.password) {
    throw new ValidationError("Name, email, username, and password are required");
  }

  const email = userData.email.trim().toLowerCase();
  const username = userData.username.trim().toLowerCase();


  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const errors = [];

    if (existingUser.email === email) {
      errors.push({
        location: "body",
        field: "email",
        message: "Email is already in use",
      });
    }

    if (existingUser.username === username) {
      errors.push({
        location: "body",
        field: "username",
        message: "Username is already in use",
      });
    }

    throw new ValidationError("Check the highlighted fields", errors);
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const createdUser = await User.create({
    name: userData.name,
    email: userData.email,
    username: userData.username,
    passwordHash,
    profileImage: userData.profileImage ?? null,
  });

  const safeUser = await User.findById(createdUser._id);

  return safeUser;
}

export async function getAllUsers() {
  const users = await User.find({
    deletedAt: null,
  }).sort({ createdAt: -1 });

  return users;
}

export async function getUserById(id: string) {
  const user = await User.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function deleteUser(id: string, deletedByUserId: string) {
  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.deletedAt) {
    throw new ValidationError("User is already deleted");
  }

  user.deletedAt = new Date();
  user.deletedBy = new Types.ObjectId(deletedByUserId);
  user.deleteReason =
    user._id.toString() === deletedByUserId
      ? "User requested account deletion"
      : "Account deleted by admin";

  await user.save();

  return { message: "User deleted successfully" };
}

export async function updateUser(id: string, userData: UpdatedUserInput) {

  const user = await User.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updateData: {
    name?: string;
    email?: string;
    username?: string;
    passwordHash?: string;
    role?: UserRole;
  } = {};

  if (userData.name !== undefined) {
    const name = userData.name.trim();

    if (!name) {
      throw new ValidationError("Name cannot be empty");
    }

    updateData.name = name;
  }

  if (userData.email !== undefined) {
    const email = userData.email.trim().toLowerCase();

    if (!email) {
      throw new ValidationError("Email cannot be empty");
    }

    updateData.email = email;
  }

  if (userData.username !== undefined) {
    const username = userData.username.trim().toLowerCase();

    if (!username) {
      throw new ValidationError("Username cannot be empty");
    }

    updateData.username = username;
  }

  if (userData.role !== undefined) {
    updateData.role = userData.role;
  }

  const conflictConditions = [];

  if (updateData.email) {
    conflictConditions.push({ email: updateData.email });
  }

  if (updateData.username) {
    conflictConditions.push({ username: updateData.username });
  }

  if (conflictConditions.length > 0) {
    const existingUser = await User.findOne({
      _id: { $ne: id },
      $or: conflictConditions,
    });

    if (existingUser) {
      throw new ConflictError("Email or username already in use");
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: id,
      deletedAt: null,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  return updatedUser;

}

export async function changePasswordService(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordCorrect) {
    throw new ValidationError("Current password is incorrect");
  }

  if (!newPassword) {
    throw new ValidationError("New password cannot be empty");
  }

  if (newPassword.length < 8) {
    throw new ValidationError("New password must be at least 8 characters");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  await user.save();

  return {
    message: "Password updated successfully",
  };
}
