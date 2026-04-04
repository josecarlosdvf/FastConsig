import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { OpsRepository } from "./ops.repository";

const router = Router();
const controller = new OpsController(new OpsService(new OpsRepository()));

router.use(apiRateLimiter, tenantMiddleware, authMiddleware);
router.get("/observability", requirePermission("event:read"), (req, res) =>
  void controller.observability(req, res)
);

export { router as opsRouter };
