import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TenantRequest } from "./tenant.middleware";

export interface AuthRequest extends TenantRequest {
  userId: string;
  userRole: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não informado" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não configurado");

    const payload = jwt.verify(token, secret) as {
      sub: string;
      role: string;
      tenantId: string;
    };

    (req as AuthRequest).userId = payload.sub;
    (req as AuthRequest).userRole = payload.role;
    (req as AuthRequest).tenantId = payload.tenantId;

    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
