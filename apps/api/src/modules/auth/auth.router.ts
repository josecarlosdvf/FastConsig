import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";
import { authRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { loginSchema, refreshSchema } from "./auth.schema";

const router = Router();
const controller = new AuthController(new AuthService(new AuthRepository()));

router.post("/login", authRateLimiter, tenantMiddleware, validate(loginSchema), (req, res) =>
  controller.login(req, res)
);

router.post("/refresh", authRateLimiter, tenantMiddleware, validate(refreshSchema), (req, res) =>
  controller.refresh(req, res)
);

router.post("/logout", tenantMiddleware, validate(refreshSchema), (req, res) =>
  controller.logout(req, res)
);

export { router as authRouter };
