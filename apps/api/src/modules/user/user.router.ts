import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";

const router = Router();
const controller = new UserController(new UserService(new UserRepository()));

router.use(apiRateLimiter);
router.use(authMiddleware);

router.get("/", (req, res) => controller.findAll(req, res));
router.get("/:id", (req, res) => controller.findById(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.put("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.remove(req, res));

export { router as userRouter };
