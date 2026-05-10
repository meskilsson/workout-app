import { z } from 'zod';

export const userIdParamsSchema = z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
});

const nameSchema = z.string().trim().min(2).max(50);

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email());

const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(20)
    .regex(
        /^[a-z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
    );


const passwordSchema = z.string().min(8).max(100);

export const createUserSchema = z.strictObject({
    name: nameSchema,
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    role: z.enum(["user"]).default("user"),
});

