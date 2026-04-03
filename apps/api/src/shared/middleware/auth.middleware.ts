import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getContext, createLogger } from "@fastconsig/core";
import { TenantRequest } from "./tenant.middleware";

const log = createLogger("auth-middleware");

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

    // Enrich the request context so all logs downstream automatically include userId
    const ctx = getContext();
    if (ctx) ctx.userId = payload.sub;

    next();
  } catch (err) {
    log.warn({ err }, "JWT verification failed");
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
