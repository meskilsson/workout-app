import User from "../models/User";
import bcrypt from 'bcrypt';
import type { UserRole } from "@workout-app/shared";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";


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
    throw new ConflictError("Email or username already in use");
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
  const users = await User.find().sort({ createdAt: -1 });
  return users;
}

export async function getUserById(id: string) {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found") as Error & {
      statusCode?: number;
    };
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export async function deleteUser(id: string) {
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    throw new NotFoundError("User not found");
  }

  return { message: "User deleted successfully" };
}

export async function updateUser(id: string, userData: UpdatedUserInput) {

  const user = await User.findById(id);

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

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedUser;

}

export async function changePasswordService(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId).select("+passwordHash");

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
