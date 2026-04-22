import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";


const adminRouter = Router();

adminRouter.get("/dashboard", requireAuth, requireRole("admin"), (_req, res) => {
    res.json({ message: "Admin access granted" });
});

export default adminRouter;