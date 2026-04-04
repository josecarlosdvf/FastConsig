import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import { ConfigService } from "./config.service";
import type { UpdateConfigInput } from "./config.schema";

export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  async listTenant(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    res.json(await this.service.listTenantConfig(tenantId));
  }

  async listSystem(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    res.json(await this.service.listSystemConfig(tenantId));
  }

  async listEffective(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    res.json(await this.service.listEffectiveConfig(tenantId));
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const body = req.body as UpdateConfigInput;
    const result = await this.service.updateScopeConfig("tenant", body.entries, tenantId);
    res.json(result);
  }

  async updateSystem(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const body = req.body as UpdateConfigInput;
    const result = await this.service.updateScopeConfig("system", body.entries, tenantId);
    res.json(result);
  }
}
