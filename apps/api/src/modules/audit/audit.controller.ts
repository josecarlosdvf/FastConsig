import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import { AuditService } from "./audit.service";
import type { ListAuditQuery } from "./audit.schema";

export class AuditController {
  constructor(private readonly service: AuditService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const query = req.query as unknown as ListAuditQuery;
    res.json(await this.service.list(tenantId, query));
  }

  async export(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const query = req.query as unknown as ListAuditQuery;
    const data = await this.service.list(tenantId, query);
    res.setHeader("content-type", "application/json");
    res.setHeader("content-disposition", "attachment; filename=audit-trail.json");
    res.send(JSON.stringify(data, null, 2));
  }
}
