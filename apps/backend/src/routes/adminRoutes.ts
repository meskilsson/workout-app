import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { userIdParamsSchema } from "../schemas/userSchemas";
import { adminListSchema, adminUserSchema, adminExerciseSchema, adminTemplateSchema, adminSessionSchema } from "../schemas/adminSchemas";
import * as admin from "../controllers/adminController";


const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/dashboard", admin.overview);
adminRouter.get("/users", validateRequest({ query: adminListSchema }), admin.listUsers);
adminRouter.get("/users/:id", validateRequest({ params: userIdParamsSchema }), admin.userDetails);
adminRouter.patch("/users/:id", validateRequest({ params: userIdParamsSchema, body: adminUserSchema }), admin.updateUser);
for (const resource of ["exercises", "templates", "sessions"] as const) {
  const body = resource === "exercises" ? adminExerciseSchema : resource === "templates" ? adminTemplateSchema : adminSessionSchema;
  adminRouter.get(`/${resource}`, validateRequest({ query: adminListSchema }), admin.listResource(resource));
  adminRouter.get(`/${resource}/:id`, validateRequest({ params: userIdParamsSchema }), admin.resourceDetails(resource));
  adminRouter.post(`/${resource}`, validateRequest({ body }), admin.saveResource(resource, false));
  adminRouter.put(`/${resource}/:id`, validateRequest({ params: userIdParamsSchema, body }), admin.saveResource(resource, true));
  adminRouter.delete(`/${resource}/:id`, validateRequest({ params: userIdParamsSchema }), admin.deleteResource(resource));
}

export default adminRouter;
