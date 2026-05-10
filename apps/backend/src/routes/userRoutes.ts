import { Router } from "express";

import { getAllUsers, getUserById, createUser, deleteUser, updateUser, changePassword } from "../controllers/userController";
import { validateRequest } from "../middleware/validate";
import { createUserSchema, userIdParamsSchema, changePasswordSchema, updateUserSchema } from "../schemas/userSchemas";
import { requireAuth } from "../middleware/requireAuth";

const userRouter = Router();

userRouter.get("/", requireAuth, getAllUsers);
userRouter.get("/:id", requireAuth, validateRequest({ params: userIdParamsSchema }), getUserById);


userRouter.post("/", validateRequest({ body: createUserSchema }), createUser);

userRouter.patch("/:id", requireAuth, validateRequest({ params: userIdParamsSchema, body: updateUserSchema }), updateUser);
userRouter.patch("/:id/password", requireAuth, validateRequest({ params: userIdParamsSchema, body: changePasswordSchema }), changePassword);

userRouter.delete("/:id", requireAuth, validateRequest({ params: userIdParamsSchema }), deleteUser);

export default userRouter;
