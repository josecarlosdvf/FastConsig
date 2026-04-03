import { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSIONS, UserRole, Permission } from "@fastconsig/types";
import { AuthRequest } from "./auth.middleware";

/**
 * RBAC middleware factory — role-based access control.
 *
 * Checks that the authenticated user has one of the specified roles.
 * Must be mounted AFTER `authMiddleware`.
 *
 * Usage:
 *   router.post("/", authMiddleware, requireRole("ADMIN"), handler);
 *   router.delete("/:id", authMiddleware, requireRole("ADMIN", "MEMBER"), handler);
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { userRole } = req as AuthRequest;

    if (!roles.includes(userRole as UserRole)) {
      res.status(403).json({
        error: "Permissão insuficiente",
        required: roles,
        current: userRole,
      });
      return;
    }

    next();
  };
}

/**
 * RBAC middleware factory — permission-based access control.
 *
 * Checks that the authenticated user's role includes the specified permission
 * in the `ROLE_PERMISSIONS` catalogue.
 * Must be mounted AFTER `authMiddleware`.
 *
 * Usage:
 *   router.post("/", authMiddleware, requirePermission("user:write"), handler);
 *
 * Prefer `requirePermission` over `requireRole` for granular checks — it
 * decouples the route from the role name and makes the intent explicit.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { userRole } = req as AuthRequest;
    const allowed = ROLE_PERMISSIONS[userRole as UserRole] ?? [];

    if (!allowed.includes(permission)) {
      res.status(403).json({
        error: "Permissão insuficiente",
        required: permission,
        current: userRole,
      });
      return;
    }

    next();
  };
}
