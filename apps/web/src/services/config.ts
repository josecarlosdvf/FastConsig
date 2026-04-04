import { api } from "./api";

export type ConfigType = "string" | "number" | "boolean" | "enum" | "json";
export type ConfigCategory = "security" | "auth" | "platform" | "branding" | "ops";

export interface ConfigItem {
  key: string;
  scope: "system" | "tenant";
  category: ConfigCategory;
  label: string;
  description?: string;
  type: ConfigType;
  options?: string[];
  value: string | number | boolean | Record<string, unknown>;
  updatedAt?: string;
  updatedBy?: string;
}

interface ConfigUpdatePayload {
  entries: Array<{ key: string; value: string | number | boolean | Record<string, unknown> }>;
}

export const configApi = {
  listTenant: (tenantId: string, token: string): Promise<ConfigItem[]> =>
    api.get<ConfigItem[]>("/api/config/tenant", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),

  listSystem: (tenantId: string, token: string): Promise<ConfigItem[]> =>
    api.get<ConfigItem[]>("/api/config/system", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateTenant: (
    tenantId: string,
    token: string,
    payload: ConfigUpdatePayload
  ): Promise<ConfigItem[]> =>
    api.put<ConfigItem[]>("/api/config/tenant", payload, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateSystem: (
    tenantId: string,
    token: string,
    payload: ConfigUpdatePayload
  ): Promise<ConfigItem[]> =>
    api.put<ConfigItem[]>("/api/config/system", payload, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};
