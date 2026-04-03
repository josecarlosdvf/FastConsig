import { Request, Response, NextFunction } from "express";

export interface TenantRequest extends Request {
  tenantId: string;
}

export function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.headers["x-tenant-id"] as string | undefined;

  if (!tenantId) {
    res.status(400).json({ error: "Tenant não informado" });
    return;
  }

  (req as TenantRequest).tenantId = tenantId;
  next();
}
