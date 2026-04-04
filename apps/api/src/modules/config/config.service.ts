import type { ConfigDefinition, ConfigScope } from "@fastconsig/types";
import { pluginRegistry, eventBus } from "@fastconsig/core";
import { ConfigRepository } from "./config.repository";
import { BASE_CONFIG_DEFINITIONS } from "./config.definitions";
import { getRedisClient } from "../../shared/cache/redis";

type ConfigValue = string | number | boolean | Record<string, unknown>;

interface UpdateEntry {
  key: string;
  value: ConfigValue;
}

interface ConfigResolved {
  key: string;
  scope: ConfigScope;
  category: ConfigDefinition["category"];
  label: string;
  description?: string;
  type: ConfigDefinition["type"];
  options?: string[];
  value: ConfigValue;
  updatedAt?: string;
  updatedBy?: string;
}

interface ConfigResolvedTyped extends ConfigResolved {
  source: "tenant" | "system" | "default";
}

export class ConfigService {
  constructor(private readonly repo: ConfigRepository) {}

  private cacheKey(scope: ConfigScope, tenantId: string): string {
    return `config:${scope}:${tenantId}`;
  }

  private async getCached(scope: ConfigScope, tenantId: string): Promise<ConfigResolved[] | null> {
    const redis = await getRedisClient();
    if (!redis) return null;
    const payload = await redis.get(this.cacheKey(scope, tenantId));
    if (!payload) return null;
    return JSON.parse(payload) as ConfigResolved[];
  }

  private async setCached(scope: ConfigScope, tenantId: string, value: ConfigResolved[]): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.set(this.cacheKey(scope, tenantId), JSON.stringify(value), { EX: 120 });
  }

  private async invalidateCache(tenantId: string): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.del([
      this.cacheKey("system", tenantId),
      this.cacheKey("tenant", tenantId),
    ]);
  }

  private listDefinitions(): ConfigDefinition[] {
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

  async listTenantConfig(tenantId: string): Promise<ConfigResolved[]> {
    const cached = await this.getCached("tenant", tenantId);
    if (cached) return cached;

    const definitions = this.listDefinitions();
    const values = await this.repo.listValues("tenant", tenantId);
    const valueMap = new Map(values.map((v) => [v.key, v]));

    const resolved = definitions
      .filter((def) => def.scope === "tenant")
      .map((def) => {
        const stored = valueMap.get(def.key);
        return {
          key: def.key,
          scope: def.scope,
          category: def.category,
          label: def.label,
          description: def.description,
          type: def.type,
          options: def.options,
          value: stored?.value ?? def.defaultValue,
          updatedAt: stored?.updatedAt?.toISOString(),
          updatedBy: stored?.updatedBy,
        };
      });
    await this.setCached("tenant", tenantId, resolved);
    return resolved;
  }

  async listSystemConfig(tenantId: string): Promise<ConfigResolved[]> {
    const cached = await this.getCached("system", tenantId);
    if (cached) return cached;

    const definitions = this.listDefinitions();
    const values = await this.repo.listValues("system", tenantId);
    const valueMap = new Map(values.map((v) => [v.key, v]));

    const resolved = definitions
      .filter((def) => def.scope === "system")
      .map((def) => {
        const stored = valueMap.get(def.key);
        return {
          key: def.key,
          scope: def.scope,
          category: def.category,
          label: def.label,
          description: def.description,
          type: def.type,
          options: def.options,
          value: stored?.value ?? def.defaultValue,
          updatedAt: stored?.updatedAt?.toISOString(),
          updatedBy: stored?.updatedBy,
        };
      });
    await this.setCached("system", tenantId, resolved);
    return resolved;
  }

  async updateScopeConfig(
    scope: ConfigScope,
    entries: UpdateEntry[],
    tenantId?: string
  ): Promise<ConfigResolved[]> {
    if (!tenantId) {
      const err = new Error("tenantId é obrigatório para atualizar configurações") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }
    const definitions = this.listDefinitions().filter((def) => def.scope === scope);
    const defMap = new Map(definitions.map((d) => [d.key, d]));
    const existing = await this.repo.listValues(scope, tenantId);
    const oldValueMap = new Map(existing.map((item) => [item.key, item.value]));

    for (const entry of entries) {
      const def = defMap.get(entry.key);
      if (!def) {
        const err = new Error(`Configuração inválida: ${entry.key}`) as Error & { statusCode: number };
        err.statusCode = 400;
        throw err;
      }

      if (def.type === "enum") {
        if (
          typeof entry.value !== "string" &&
          typeof entry.value !== "number" &&
          typeof entry.value !== "boolean"
        ) {
          const err = new Error(`Valor inválido para ${entry.key}.`) as Error & {
            statusCode: number;
          };
          err.statusCode = 422;
          throw err;
        }
        const typedValue = `${entry.value}`;
        const options = def.options ?? [];
        if (!options.includes(typedValue)) {
          const err = new Error(`Valor inválido para ${entry.key}. Opções: ${options.join(", ")}`) as Error & {
            statusCode: number;
          };
          err.statusCode = 422;
          throw err;
        }
      }

      const oldValue = oldValueMap.get(def.key);
      await this.repo.upsertValue(def.key, scope, entry.value, tenantId);
      eventBus.emit("config.updated", {
        tenantId,
        key: def.key,
        scope,
        oldValue,
        newValue: entry.value,
      });
    }
    await this.invalidateCache(tenantId);

    return scope === "system"
      ? this.listSystemConfig(tenantId)
      : this.listTenantConfig(tenantId);
  }

  async listEffectiveConfig(tenantId: string): Promise<ConfigResolvedTyped[]> {
    const definitions = this.listDefinitions();
    const tenantValues = await this.repo.listValues("tenant", tenantId);
    const systemValues = await this.repo.listValues("system", tenantId);
    const tenantMap = new Map(tenantValues.map((v) => [v.key, v]));
    const systemMap = new Map(systemValues.map((v) => [v.key, v]));

    return definitions.map((def) => {
      const tenantStored = tenantMap.get(def.key);
      const systemStored = systemMap.get(def.key);
      if (tenantStored) {
        return {
          key: def.key,
          scope: def.scope,
          category: def.category,
          label: def.label,
          description: def.description,
          type: def.type,
          options: def.options,
          value: tenantStored.value,
          updatedAt: tenantStored.updatedAt.toISOString(),
          updatedBy: tenantStored.updatedBy,
          source: "tenant",
        };
      }

      if (systemStored) {
        return {
          key: def.key,
          scope: def.scope,
          category: def.category,
          label: def.label,
          description: def.description,
          type: def.type,
          options: def.options,
          value: systemStored.value,
          updatedAt: systemStored.updatedAt.toISOString(),
          updatedBy: systemStored.updatedBy,
          source: "system",
        };
      }

      return {
        key: def.key,
        scope: def.scope,
        category: def.category,
        label: def.label,
        description: def.description,
        type: def.type,
        options: def.options,
        value: def.defaultValue,
        source: "default",
      };
    });
  }
}
