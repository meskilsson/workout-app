import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUser,
  changePassword,
} from "../controllers/userController";
import { validateRequest } from "../middleware/validate";
import {
  createUserSchema,
  userIdParamsSchema,
  changePasswordSchema,
  updateUserSchema,
} from "../schemas/userSchemas";
import { requireAuth } from "../middleware/requireAuth";
import { requireSelfOrAdmin } from "../middleware/requireSelfOrAdmin";

const userRouter = Router();

userRouter.get("/", requireAuth, getAllUsers);
userRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: userIdParamsSchema }),
  requireSelfOrAdmin,
  getUserById,
);

userRouter.post("/", validateRequest({ body: createUserSchema }), createUser);

userRouter.patch(
  "/:id",
  requireAuth,
  validateRequest({ params: userIdParamsSchema, body: updateUserSchema }),
  requireSelfOrAdmin,
  updateUser,
);
userRouter.patch(
  "/:id/password",
  requireAuth,
  validateRequest({ params: userIdParamsSchema, body: changePasswordSchema }),
  requireSelfOrAdmin,
  changePassword,
);

userRouter.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: userIdParamsSchema }),
  requireSelfOrAdmin,
  deleteUser,
);

export default userRouter;
