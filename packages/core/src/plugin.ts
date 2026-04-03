import { Application } from "express";
import { AppEventName, AppEventPayload, EventBus, eventBus as defaultEventBus } from "./event-bus";
import { createLogger } from "./logger";
import { ConfigDefinition, PageDefinition, Permission } from "@fastconsig/types";

const log = createLogger("plugin-registry");

/**
 * A plugin extends the application with new capabilities.
 * Each plugin receives the Express app and can register routes,
 * middleware, jobs, or any other functionality.
 *
 * Convention:
 * - plugins communicate with the core only via the Service layer
 * - plugins never import from another plugin's internal modules
 * - all plugin routes must be prefixed with /api/plugins/:name/
 *
 * Hooks allow plugins to react to domain events without coupling to the
 * emitting module. The registry subscribes the hooks automatically on bootstrap.
 */
export interface Plugin {
  /** Unique machine-readable identifier (kebab-case) */
  readonly name: string;
  /** Human-readable description */
  readonly description?: string;
  /** Semantic version */
  readonly version: string;
  /**
   * Declared platform permissions the plugin requires.
   *
   * These are purely declarative today — they document intent, show up in
   * bootstrap logs, and establish the catalogue for future runtime enforcement
   * (e.g. admin approval flow, permission checks in service calls).
   *
   * @example
   * permissions: ["user:read", "user:write", "tenant:read"]
   */
  readonly permissions?: Permission[];
  /** Optional config definitions contributed by this plugin */
  readonly configs?: ConfigDefinition[];
  /** Optional UI pages contributed by this plugin */
  readonly pages?: PageDefinition[];
  /** Called once during application startup */
  register(app: Application): void | Promise<void>;
  /**
   * Optional event hooks. Each key is an event name; the value is a handler
   * that will be subscribed to the event bus automatically on bootstrap.
   *
   * @example
   * hooks: {
   *   "user.created": ({ tenantId, email }) => sendWelcomeEmail(email),
   * }
   */
  hooks?: Partial<{
    [K in AppEventName]: (payload: AppEventPayload<K>) => void | Promise<void>;
  }>;
}

export class PluginRegistry {
  private readonly plugins = new Map<string, Plugin>();
  private readonly configs = new Map<string, ConfigDefinition>();
  private readonly pages = new Map<string, PageDefinition>();

  register(plugin: Plugin): this {
    if (this.plugins.has(plugin.name)) {
      throw new Error(
        `Plugin "${plugin.name}" já está registrado. Cada plugin deve ter um nome único.`
      );
    }
    this.plugins.set(plugin.name, plugin);

    for (const config of plugin.configs ?? []) {
      if (this.configs.has(config.key)) {
        throw new Error(`Config "${config.key}" já está registrada por outro plugin.`);
      }
      this.configs.set(config.key, config);
    }

    for (const page of plugin.pages ?? []) {
      if (this.pages.has(page.key)) {
        throw new Error(`Page "${page.key}" já está registrada por outro plugin.`);
      }
      this.pages.set(page.key, page);
    }

    return this;
  }

  async bootstrap(app: Application, bus: EventBus = defaultEventBus): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.register(app);

      // Subscribe any declared event hooks to the event bus
      if (plugin.hooks) {
        for (const [event, handler] of Object.entries(plugin.hooks) as [
          AppEventName,
          (payload: AppEventPayload<AppEventName>) => void | Promise<void>,
        ][]) {
          bus.on(event, handler);
        }
      }

      log.info(
        {
          plugin: plugin.name,
          version: plugin.version,
          permissions: plugin.permissions ?? [],
        },
        "Plugin registrado"
      );
    }
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  listConfigDefinitions(): ConfigDefinition[] {
    return Array.from(this.configs.values());
  }

  listPages(): PageDefinition[] {
    return Array.from(this.pages.values());
  }
}

/** Singleton registry used by the application */
export const pluginRegistry = new PluginRegistry();
