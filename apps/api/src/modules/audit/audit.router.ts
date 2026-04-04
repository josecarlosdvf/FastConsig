import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { validateQuery } from "../../shared/middleware/validate.middleware";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { AuditRepository } from "./audit.repository";
import { listAuditQuerySchema } from "./audit.schema";

const router = Router();
const controller = new AuditController(new AuditService(new AuditRepository()));

router.use(apiRateLimiter, tenantMiddleware, authMiddleware);
router.get("/", requirePermission("audit:read"), validateQuery(listAuditQuerySchema), (req, res) =>
  void controller.list(req, res)
);
router.get("/export", requirePermission("audit:read"), validateQuery(listAuditQuerySchema), (req, res) =>
  void controller.export(req, res)
);

export { router as auditRouter };
