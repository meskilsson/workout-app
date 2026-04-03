import User, { IUser } from "../models/User";

export async function createUser(userData: IUser) {
  const user = await User.create(userData);
  return user;
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
