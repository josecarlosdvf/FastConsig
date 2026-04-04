import { ROLE_PERMISSIONS, UserRole } from "@fastconsig/types";
import { ControlPlaneRepository } from "./control-plane.repository";

export class ControlPlaneService {
  constructor(private readonly repo: ControlPlaneRepository) {}

  listPagesForRole(role: string): ReturnType<ControlPlaneRepository["listPages"]> {
    const allowed = new Set(ROLE_PERMISSIONS[role as UserRole] ?? []);
    return this.repo
      .listPages()
      .filter((page) => page.requiredPermissions.every((permission) => allowed.has(permission)));
  }
}
