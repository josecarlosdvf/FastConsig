/**
 * Platform permission catalogue.
 *
 * Permissions are declared as fine-grained strings (`resource:action`).
 * Each UserRole is mapped to a fixed set of permissions. RBAC middleware
 * checks that the authenticated user's role includes the required permission.
 *
 * Convention:
 * - `resource:read`   — list / get
 * - `resource:write`  — create / update
 * - `resource:delete` — soft-delete / revoke
 * - `resource:admin`  — privileged operations (e.g. managing tenants)
 */
export type Permission =
  | "user:read"
  | "user:write"
  | "user:delete"
  | "tenant:read"
  | "tenant:write"
  | "tenant:admin"
  | "session:read"
  | "session:delete";

export type UserRole = "ADMIN" | "MEMBER";

/**
 * Maps each role to its complete set of allowed permissions.
 *
 * Rules:
 * - ADMIN has full access to every resource.
 * - MEMBER can read users/tenants and manage their own sessions only.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    "user:read",
    "user:write",
    "user:delete",
    "tenant:read",
    "tenant:write",
    "tenant:admin",
    "session:read",
    "session:delete",
  ],
  MEMBER: [
    "user:read",
    "tenant:read",
    "session:read",
    "session:delete",
  ],
} as const;
