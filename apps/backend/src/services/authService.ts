import User from "../models/User";
import bcrypt from 'bcrypt';

//Login function that finds and awaits a user email with passwordHash.

export async function loginUser(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!user) {
        const error = new Error("invalid email or password") as Error & {
            statusCode?: number;
        };
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        const error = new Error("Invalid email or password") as Error & {
            statusCode?: number;
        };
        error.statusCode = 401;
        throw error;
    }

    return user;
}
