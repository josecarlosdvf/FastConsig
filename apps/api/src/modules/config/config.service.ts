import type { ConfigDefinition, ConfigScope } from "@fastconsig/types";
import { pluginRegistry } from "@fastconsig/core";
import { ConfigRepository } from "./config.repository";
import { BASE_CONFIG_DEFINITIONS } from "./config.definitions";

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

export class ConfigService {
  constructor(private readonly repo: ConfigRepository) {}

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
    const definitions = this.listDefinitions();
    const values = await this.repo.listValues("tenant", tenantId);
    const valueMap = new Map(values.map((v) => [v.key, v]));

    return definitions
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
  }

  async listSystemConfig(tenantId: string): Promise<ConfigResolved[]> {
    const definitions = this.listDefinitions();
    const values = await this.repo.listValues("system", tenantId);
    const valueMap = new Map(values.map((v) => [v.key, v]));

    return definitions
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
  }

  async updateScopeConfig(
    scope: ConfigScope,
    entries: UpdateEntry[],
    tenantId?: string
  ): Promise<ConfigResolved[]> {
    const definitions = this.listDefinitions().filter((def) => def.scope === scope);
    const defMap = new Map(definitions.map((d) => [d.key, d]));

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

      await this.repo.upsertValue(def.key, scope, entry.value, tenantId);
    }

    return scope === "system"
      ? this.listSystemConfig(tenantId as string)
      : this.listTenantConfig(tenantId as string);
  }
}
