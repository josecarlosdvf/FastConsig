import type { Permission } from "./permissions";

export type ConfigScope = "system" | "tenant";
export type ConfigCategory = "security" | "auth" | "platform" | "branding" | "ops";
export type ConfigType = "string" | "number" | "boolean" | "enum" | "json";

export interface ConfigDefinition {
  key: string;
  label: string;
  description?: string;
  type: ConfigType;
  scope: ConfigScope;
  category: ConfigCategory;
  defaultValue: string | number | boolean | Record<string, unknown>;
  options?: string[];
  isSecret?: boolean;
}

export interface ConfigValue {
  key: string;
  scope: ConfigScope;
  tenantId?: string;
  value: string | number | boolean | Record<string, unknown>;
  updatedAt: string;
  updatedBy?: string;
}

export interface PageDefinition {
  key: string;
  route: string;
  title: string;
  description?: string;
  requiredPermissions: Permission[];
}

export interface PluginRegistrationContract {
  configs?: ConfigDefinition[];
  pages?: PageDefinition[];
  permissions?: Permission[];
}

export interface ConfigSchemaMap {
  "auth.session.timeout_seconds": number;
  "auth.refresh.max_days": number;
  "platform.maintenance.enabled": boolean;
  "platform.tenant_default_theme": "light" | "dark";
}

export interface TypedConfigAccessor {
  get<K extends keyof ConfigSchemaMap>(key: K): ConfigSchemaMap[K];
}
