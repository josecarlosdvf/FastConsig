import { getContext, pluginRegistry } from "@fastconsig/core";
import type { ConfigDefinition } from "@fastconsig/types";

type ConfigValue = string | number | boolean | Record<string, unknown>;
type Scope = "system" | "tenant";

interface ConfigStoreEntry {
  key: string;
  scope: Scope;
  tenantId?: string;
  value: ConfigValue;
  updatedAt: Date;
  updatedBy?: string;
}

const configStore = new Map<string, ConfigStoreEntry>();

const BASE_CONFIG_DEFINITIONS: ConfigDefinition[] = [
  {
    key: "auth.session.timeout_seconds",
    label: "Tempo de sessão (segundos)",
    description: "Define a expiração padrão de sessão para usuários autenticados.",
    type: "number",
    scope: "tenant",
    category: "security",
    defaultValue: 3600,
  },
  {
    key: "auth.refresh.max_days",
    label: "Validade do refresh token (dias)",
    description: "Quantidade máxima de dias antes de exigir novo login.",
    type: "number",
    scope: "tenant",
    category: "auth",
    defaultValue: 7,
  },
  {
    key: "platform.maintenance.enabled",
    label: "Modo manutenção",
    description: "Quando habilitado, operações administrativas podem ser restritas.",
    type: "boolean",
    scope: "system",
    category: "ops",
    defaultValue: false,
  },
  {
    key: "platform.tenant_default_theme",
    label: "Tema padrão do tenant",
    description: "Tema inicial aplicado na criação de novos tenants.",
    type: "enum",
    scope: "system",
    category: "branding",
    defaultValue: "light",
    options: ["light", "dark"],
  },
];

function serializeValue(value: ConfigValue): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function deserializeValue(value: string): ConfigValue {
  try {
    return JSON.parse(value) as ConfigValue;
  } catch {
    return value;
  }
}

function configMapKey(key: string, scope: Scope, tenantId?: string): string {
  return `${scope}:${tenantId ?? "system"}:${key}`;
}

export class ConfigRepository {
  listDefinitions(): ConfigDefinition[] {
    const pluginDefinitions = pluginRegistry.listConfigDefinitions();
    const merged = new Map<string, ConfigDefinition>();
    for (const definition of BASE_CONFIG_DEFINITIONS) {
      merged.set(definition.key, definition);
    }
    for (const definition of pluginDefinitions) {
      merged.set(definition.key, definition);
    }
    return Array.from(merged.values());
  }

  listValues(scope: Scope, tenantId?: string): ConfigStoreEntry[] {
    return Array.from(configStore.values()).filter((entry) => {
      if (entry.scope !== scope) return false;
      if (scope === "tenant") return entry.tenantId === tenantId;
      return true;
    });
  }

  upsertValue(
    key: string,
    scope: Scope,
    value: ConfigValue,
    tenantId?: string
  ): ConfigStoreEntry {
    const ctx = getContext();
    const entry: ConfigStoreEntry = {
      key,
      scope,
      tenantId,
      value: deserializeValue(serializeValue(value)),
      updatedAt: new Date(),
      updatedBy: ctx?.userId,
    };
    configStore.set(configMapKey(key, scope, tenantId), entry);
    return entry;
  }
}
