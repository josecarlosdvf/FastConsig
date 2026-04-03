import { Router } from "express";
import { TenantController } from "./tenant.controller";
import { TenantService } from "./tenant.service";
import { TenantRepository } from "./tenant.repository";
import { apiRateLimiter } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { createTenantSchema, updateTenantSchema } from "./tenant.schema";

const router = Router();
const controller = new TenantController(new TenantService(new TenantRepository()));

router.use(apiRateLimiter);

// Note: Tenant routes are public to allow bootstrapping (creating the first tenant).
// In a production deployment, lock these down behind an API key or admin token.
router.get("/", (req, res) => controller.findAll(req, res));
router.get("/:id", (req, res) => controller.findById(req, res));
router.post("/", validate(createTenantSchema), (req, res) => controller.create(req, res));
router.put("/:id", validate(updateTenantSchema), (req, res) => controller.update(req, res));

export { router as tenantRouter };
