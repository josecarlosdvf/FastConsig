import { api } from "./api";
import type { Permission } from "@fastconsig/types";

export interface ControlPlanePage {
  key: string;
  route: string;
  title: string;
  description?: string;
  requiredPermissions: Permission[];
}

export const controlPlaneApi = {
  listPages: (tenantId: string, token: string): Promise<ControlPlanePage[]> =>
    api.get<ControlPlanePage[]>("/api/control-plane/pages", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};
