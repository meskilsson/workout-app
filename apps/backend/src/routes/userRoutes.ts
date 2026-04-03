import { Router } from "express";

import { createUser, getAllUsers, getUserById } from "../services/userService";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);

export default userRouter;
