import { Router } from "express";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";
import { ConfigRepository } from "./config.repository";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { updateConfigSchema } from "./config.schema";

const router = Router();
const controller = new ConfigController(new ConfigService(new ConfigRepository()));

router.use(apiRateLimiter, tenantMiddleware, authMiddleware);

router.get("/tenant", requirePermission("config:read"), (req, res) =>
  void controller.listTenant(req, res)
);
router.put("/tenant", requirePermission("config:write"), validate(updateConfigSchema), (req, res) =>
  void controller.updateTenant(req, res)
);

router.get("/system", requirePermission("config:read"), (req, res) =>
  void controller.listSystem(req, res)
);
router.get("/effective", requirePermission("config:read"), (req, res) =>
  void controller.listEffective(req, res)
);
router.put("/system", requirePermission("config:write"), validate(updateConfigSchema), (req, res) =>
  void controller.updateSystem(req, res)
);

export { router as configRouter };
