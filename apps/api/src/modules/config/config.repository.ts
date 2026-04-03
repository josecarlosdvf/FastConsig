import { getContext, pluginRegistry } from "@fastconsig/core";
import type { ConfigDefinition } from "@fastconsig/types";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";

type ConfigValue = string | number | boolean | Record<string, unknown>;
type Scope = "system" | "tenant";

export interface ConfigStoreEntry {
  id: string;
  key: string;
  scope: Scope;
  tenantId?: string;
  value: ConfigValue;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

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

function normalizeValue(value: unknown): ConfigValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return String(value);
}

function toPrismaJson(value: ConfigValue): Prisma.InputJsonValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return value as Prisma.InputJsonObject;
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

  async listValues(scope: Scope, tenantId?: string): Promise<ConfigStoreEntry[]> {
    if (!tenantId) {
      throw new Error("tenantId é obrigatório para leitura de configurações");
    }
    const rows = await prisma.configValue.findMany({
      where: { scope, tenant_id: tenantId },
      orderBy: { key: "asc" },
    });

    return rows.map((row: Prisma.ConfigValueGetPayload<Record<string, never>>) => ({
      id: row.id,
      key: row.key,
      scope: row.scope,
      tenantId: row.tenant_id ?? undefined,
      value: normalizeValue(row.value),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by ?? undefined,
    }));
  }

  async upsertValue(
    key: string,
    scope: Scope,
    value: ConfigValue,
    tenantId?: string
  ): Promise<ConfigStoreEntry> {
    if (!tenantId) {
      throw new Error("tenantId é obrigatório para escrita de configurações");
    }
    const ctx = getContext();
    const saved = await prisma.configValue.upsert({
      where: {
        key_scope_tenant_id: {
          key,
          scope,
          tenant_id: tenantId,
        },
      },
      create: {
        key,
        scope,
        tenant_id: tenantId,
        value: toPrismaJson(value),
        updated_by: ctx?.userId ?? null,
      },
      update: {
        value: toPrismaJson(value),
        updated_by: ctx?.userId ?? null,
      },
    });

    return {
      id: saved.id,
      key: saved.key,
      scope: saved.scope,
      tenantId: saved.tenant_id ?? undefined,
      value: normalizeValue(saved.value),
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
      updatedBy: saved.updated_by ?? undefined,
    };
  }
}
