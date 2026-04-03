import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { tenantMiddleware } from "../../shared/middleware/tenant.middleware";

const router = Router();
const controller = new AuthController(new AuthService(new AuthRepository()));

router.post("/login", tenantMiddleware, (req, res) =>
  controller.login(req, res)
);

export { router as authRouter };
