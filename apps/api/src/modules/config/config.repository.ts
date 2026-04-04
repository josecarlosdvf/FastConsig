import { getContext } from "@fastconsig/core";
import type { PrismaClient } from "@prisma/client";
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

interface ConfigValueRow {
  id: string;
  key: string;
  scope: Scope;
  tenant_id: string | null;
  value: unknown;
  created_at: Date;
  updated_at: Date;
  updated_by: string | null;
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

function toPrismaJson(value: ConfigValue): unknown {
  return value;
}

function isConfigValueRow(value: unknown): value is ConfigValueRow {
  return Boolean(value) && typeof value === "object";
}

export class ConfigRepository {
  private db(): PrismaClient {
    return prisma as PrismaClient;
  }

  async listValues(scope: Scope, tenantId?: string): Promise<ConfigStoreEntry[]> {
    if (!tenantId) {
      const err = new Error("tenantId é obrigatório para leitura de configurações") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }
    const rows = (await this.db().configValue.findMany({
      where: { scope, tenant_id: tenantId },
      orderBy: { key: "asc" },
    })) as unknown as ConfigValueRow[];

    return rows.filter(isConfigValueRow).map((row: ConfigValueRow) => ({
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
    const saved = (await this.db().configValue.upsert({
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
    })) as unknown as ConfigValueRow;

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
