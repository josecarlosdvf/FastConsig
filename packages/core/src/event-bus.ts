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
  "config.updated": {
    tenantId: string;
    key: string;
    scope: "system" | "tenant";
    oldValue?: string | number | boolean | Record<string, unknown>;
    newValue: string | number | boolean | Record<string, unknown>;
  };
  "event.retry": {
    eventName: string;
    reason: string;
    attempts: number;
    tenantId?: string;
  };
  "event.dead_lettered": {
    eventName: string;
    reason: string;
    attempts: number;
    tenantId?: string;
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
      // The pending promise tracks the full lifecycle: setImmediate scheduling
      // + the async handler's completion. This avoids the race where the outer
      // promise resolves before the inner async work finishes.
      let resolvePending!: () => void;
      const p = new Promise<void>((resolve) => {
        resolvePending = resolve;
      });

      this._pending.add(p);

      setImmediate(() => {
        let result: void | Promise<void>;
        try {
          result = (handler as Handler<T>)(payload);
        } catch (err) {
          log.error({ event, err }, `Error in event handler for "${event}"`);
          resolvePending();
          this._pending.delete(p);
          return;
        }

        Promise.resolve(result)
          .catch((err) => {
            log.error({ event, err }, `Error in event handler for "${event}"`);
          })
          .finally(() => {
            resolvePending();
            this._pending.delete(p);
          });
      });
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
   * Loops until `_pending` is empty to handle handlers that themselves
   * emit further events (nested emissions).
   *
   * @example
   * await service.create(data, tenantId);
   * await eventBus.flush();
   * expect(handler).toHaveBeenCalledWith(...);
   */
  async flush(): Promise<void> {
    // Drain until no more pending work remains (handles nested emits).
    let iterations = 0;
    while (this._pending.size > 0 || iterations === 0) {
      // Allow scheduled setImmediate callbacks to fire (FIFO order).
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (this._pending.size > 0) {
        await Promise.allSettled([...this._pending]);
      }
      iterations += 1;
      // Safety: avoid infinite loop if handlers keep emitting.
      if (iterations > 10) break;
    }
  }

  /** Remove all handlers and cancel pending work tracking (useful in tests). */
  clear(): void {
    this.handlers.clear();
    this._pending.clear();
  }
}

/** Singleton event bus used by the application */
export const eventBus = new EventBus();
