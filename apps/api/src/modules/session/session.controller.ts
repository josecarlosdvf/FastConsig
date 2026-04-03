import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { AuthRequest } from "../../shared/middleware/auth.middleware";

export class SessionController {
  constructor(private service: SessionService) {}

  async listSessions(req: Request, res: Response): Promise<void> {
    const { userId, tenantId } = req as AuthRequest;
    const sessions = await this.service.listSessions(userId, tenantId);
    res.json(sessions);
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    const { userId, tenantId } = req as AuthRequest;
    const { id } = req.params;
    await this.service.revokeSession(id, userId, tenantId);
    res.status(204).send();
  }

  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    const { userId, tenantId } = req as AuthRequest;
    await this.service.revokeAllSessions(userId, tenantId);
    res.status(204).send();
  }
}
