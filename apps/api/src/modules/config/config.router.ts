import { Router } from "express";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";
import { ConfigRepository } from "./config.repository";
import { AuditService } from "../audit/audit.service";
import { AuditRepository } from "../audit/audit.repository";
import { eventsService } from "../events/events.router";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { validate, validateParams } from "../../shared/middleware/validate.middleware";
import {
  updateConfigSchema,
  rollbackConfigRequestSchema,
  listConfigVersionsParamsSchema,
} from "./config.schema";

const router = Router();
const controller = new ConfigController(
  new ConfigService(
    new ConfigRepository(),
    new AuditService(new AuditRepository()),
    eventsService
  )
);

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
router.get(
  "/versions/:scope/:key",
  requirePermission("config:read"),
  validateParams(listConfigVersionsParamsSchema),
  (req, res) => void controller.listVersions(req, res)
);
router.post("/rollback", requirePermission("config:write"), validate(rollbackConfigRequestSchema), (req, res) =>
  void controller.rollback(req, res)
);

export { router as configRouter };
