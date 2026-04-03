import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TenantRequest } from "../../shared/middleware/tenant.middleware";
import { loginSchema } from "./auth.schema";

export class AuthController {
  constructor(private service: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as TenantRequest;
    const { email, password } = loginSchema.parse(req.body);
    const result = await this.service.login(email, password, tenantId);
    res.json(result);
  }
}
