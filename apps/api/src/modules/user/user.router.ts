import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { createUserSchema, updateUserSchema } from "./user.schema";

const router = Router();
const controller = new UserController(new UserService(new UserRepository()));

router.use(apiRateLimiter);
router.use(authMiddleware);

router.get("/", requirePermission("user:read"), (req, res) => controller.findAll(req, res));
router.get("/:id", requirePermission("user:read"), (req, res) => controller.findById(req, res));
router.post("/", requirePermission("user:write"), validate(createUserSchema), (req, res) => controller.create(req, res));
router.put("/:id", requirePermission("user:write"), validate(updateUserSchema), (req, res) => controller.update(req, res));
router.delete("/:id", requirePermission("user:delete"), (req, res) => controller.remove(req, res));

export { router as userRouter };
