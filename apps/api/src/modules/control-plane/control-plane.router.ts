import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { ControlPlaneController } from "./control-plane.controller";
import { ControlPlaneService } from "./control-plane.service";
import { ControlPlaneRepository } from "./control-plane.repository";

const router = Router();
const controller = new ControlPlaneController(
  new ControlPlaneService(new ControlPlaneRepository())
);

router.use(apiRateLimiter, tenantMiddleware, authMiddleware);
router.get("/pages", (req, res) => controller.listPages(req, res));

export { router as controlPlaneRouter };
