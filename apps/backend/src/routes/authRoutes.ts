import { Router } from "express";
import { getMe, loginUser, logoutUser } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";


const authRouter = Router();

authRouter.post("/login", loginUser);
authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", logoutUser);


export default authRouter;