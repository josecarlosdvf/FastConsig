import { getContext } from "@fastconsig/core";
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
  async listValues(scope: Scope, tenantId?: string): Promise<ConfigStoreEntry[]> {
    if (!tenantId) {
      const err = new Error("tenantId é obrigatório para leitura de configurações") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
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
      const err = new Error("tenantId é obrigatório para escrita de configurações") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
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
