import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import { ConfigService } from "./config.service";
import type { UpdateConfigInput } from "./config.schema";

export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  listTenant(req: Request, res: Response): void {
    const { tenantId } = req as AuthRequest;
    res.json(this.service.listTenantConfig(tenantId));
  }

  listSystem(_req: Request, res: Response): void {
    res.json(this.service.listSystemConfig());
  }

  updateTenant(req: Request, res: Response): void {
    const { tenantId } = req as AuthRequest;
    const body = req.body as UpdateConfigInput;
    const result = this.service.updateScopeConfig("tenant", body.entries, tenantId);
    res.json(result);
  }

  updateSystem(req: Request, res: Response): void {
    const body = req.body as UpdateConfigInput;
    const result = this.service.updateScopeConfig("system", body.entries);
    res.json(result);
  }
}

