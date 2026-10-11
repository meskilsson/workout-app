import { Router } from "express";
import { getMe, loginUser, logoutUser, refreshUser } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from "../middleware/validate";
import { loginSchema } from "../schemas/userSchemas";

const authRouter = Router();

authRouter.post("/login", validateRequest({ body: loginSchema }), loginUser);
authRouter.post("/refresh", refreshUser);

authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", logoutUser);


export default authRouter;