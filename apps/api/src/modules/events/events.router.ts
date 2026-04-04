import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { EventsController } from "./events.controller";
import { EventsRepository } from "./events.repository";
import { EventsService } from "./events.service";
import { replayDeadLetterSchema } from "./events.schema";

const router = Router();
const service = new EventsService(new EventsRepository());
const controller = new EventsController(service);

router.use(apiRateLimiter, tenantMiddleware, authMiddleware);
router.get("/dead-letter", requirePermission("event:read"), (req, res) =>
  void controller.listDeadLetter(req, res)
);
router.patch(
  "/dead-letter/replay",
  requirePermission("event:write"),
  validate(replayDeadLetterSchema),
  (req, res) => void controller.replayDeadLetter(req, res)
);

export { router as eventsRouter, service as eventsService };
