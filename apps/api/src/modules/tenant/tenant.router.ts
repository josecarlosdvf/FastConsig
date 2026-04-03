import { Router } from "express";
import { TenantController } from "./tenant.controller";
import { TenantService } from "./tenant.service";
import { TenantRepository } from "./tenant.repository";

const router = Router();
const controller = new TenantController(new TenantService(new TenantRepository()));

router.get("/", (req, res) => controller.findAll(req, res));
router.get("/:id", (req, res) => controller.findById(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.put("/:id", (req, res) => controller.update(req, res));

export { router as tenantRouter };
