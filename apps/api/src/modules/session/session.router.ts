import { Router } from "express";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { SessionRepository } from "./session.repository";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";

const router = Router();
const controller = new SessionController(new SessionService(new SessionRepository()));

router.use(tenantMiddleware, authMiddleware);

router.get("/", (req, res) => controller.listSessions(req, res));
router.delete("/:id", (req, res) => controller.revokeSession(req, res));
router.delete("/", (req, res) => controller.revokeAllSessions(req, res));

export { router as sessionRouter };
