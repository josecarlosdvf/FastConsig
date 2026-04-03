import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TenantRequest } from "../../shared/middleware/tenant.middleware";

export class AuthController {
  constructor(private service: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as TenantRequest;
    // req.body is already validated by validate(loginSchema) in the router
    const { email, password } = req.body as { email: string; password: string };
    const ctx = {
      // x-forwarded-for is used for audit logging only, not for security-critical decisions.
      // Ensure your reverse proxy is configured to overwrite this header with the real IP
      // (e.g. nginx `proxy_set_header X-Forwarded-For $remote_addr`).
      ip: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? req.socket.remoteAddress,
      deviceInfo: req.headers["user-agent"],
    };
    const result = await this.service.login(email, password, tenantId, ctx);
    res.json(result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as TenantRequest;
    // req.body is already validated by validate(refreshSchema) in the router
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await this.service.refresh(refreshToken, tenantId);
    res.json(result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as TenantRequest;
    // req.body is already validated by validate(refreshSchema) in the router
    const { refreshToken } = req.body as { refreshToken: string };
    await this.service.logout(refreshToken, tenantId);
    res.status(204).send();
  }
}
