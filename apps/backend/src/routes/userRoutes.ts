import { Router } from "express";

import { getAllUsers, getUserById, createUser } from "../controllers/userController";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);

export default userRouter;
