import { createLogger } from "./logger";

const log = createLogger("event-bus");

/**
 * Typed in-process event bus.
 *
 * Defines the canonical set of domain events emitted by the application.
 * Plugins can subscribe to these events via their `hooks` field.
 *
 * ⚠️  Raw Prisma queries (`$queryRaw`, `$executeRaw`) bypass the tenant-scoped
 * client and do NOT have tenant_id automatically injected. Developers using raw
 * queries MUST add `WHERE tenant_id = $1` manually. Prefer the typed client
 * methods which are protected by `createTenantClient`.
 *
 * Usage:
 *   import { eventBus } from "@fastconsig/core";
 *   eventBus.emit("user.created", { tenantId, userId, email, role });
 *   eventBus.on("user.created", (payload) => console.log(payload.email));
 */

export interface AppEvents {
  "user.created": {
    tenantId: string;
    userId: string;
    email: string;
    role: string;
  };
  "user.updated": {
    tenantId: string;
    userId: string;
  };
  "user.deleted": {
    tenantId: string;
    userId: string;
  };
  "auth.login": {
    tenantId: string;
    userId: string;
    ip?: string;
    deviceInfo?: string;
  };
  "auth.logout": {
    tenantId: string;
    userId: string;
  };
  "auth.token_refreshed": {
    tenantId: string;
    userId: string;
  };
}

export type AppEventName = keyof AppEvents;
export type AppEventPayload<T extends AppEventName> = AppEvents[T];

type Handler<T extends AppEventName> = (payload: AppEventPayload<T>) => void | Promise<void>;

export class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<AppEventName, Set<Handler<any>>>();
  private readonly _pending = new Set<Promise<void>>();

  on<T extends AppEventName>(event: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return an unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emits an event in a fire-and-forget manner.
   *
   * Each handler is scheduled via `setImmediate` so the calling code (and the
   * HTTP response) is never blocked by slow event handlers. Errors inside
   * handlers are caught and logged but never propagate to the caller.
   *
   * In tests, call `await eventBus.flush()` after triggering an emission to
   * wait for all in-flight handlers to complete before making assertions.
   */
  emit<T extends AppEventName>(event: T, payload: AppEventPayload<T>): void {
    const set = this.handlers.get(event);
    if (!set) return;

    for (const handler of set) {
      const p = new Promise<void>((resolve) => {
        setImmediate(() => {
          let result: void | Promise<void>;
          try {
            result = (handler as Handler<T>)(payload);
          } catch (err) {
            log.error({ event, err }, `Error in event handler for "${event}"`);
            resolve();
            return;
          }
          resolve(
            Promise.resolve(result).catch((err) => {
              log.error({ event, err }, `Error in event handler for "${event}"`);
            })
          );
        });
      });

      this._pending.add(p);
      void p.finally(() => this._pending.delete(p));
    }
  }

  off<T extends AppEventName>(event: T, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Waits for all in-flight event handlers to complete.
   *
   * Use this in tests to drain the async handler queue before making
   * assertions about side effects of emitted events.
   *
   * @example
   * await service.create(data, tenantId);
   * await eventBus.flush();
   * expect(handler).toHaveBeenCalledWith(...);
   */
  async flush(): Promise<void> {
    // Let any pending setImmediate callbacks run first (FIFO order ensures
    // all emit()-scheduled callbacks fire before this one).
    await new Promise<void>((resolve) => setImmediate(resolve));
    // Then await any async work those callbacks initiated.
    if (this._pending.size > 0) {
      await Promise.allSettled([...this._pending]);
    }
  }

  /** Remove all handlers and pending work (useful in tests). */
  clear(): void {
    this.handlers.clear();
    this._pending.clear();
  }
}

/** Singleton event bus used by the application */
export const eventBus = new EventBus();
