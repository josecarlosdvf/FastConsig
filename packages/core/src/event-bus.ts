/**
 * Typed in-process event bus.
 *
 * Defines the canonical set of domain events emitted by the application.
 * Plugins can subscribe to these events via their `hooks` field.
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

  async emit<T extends AppEventName>(event: T, payload: AppEventPayload<T>): Promise<void> {
    const set = this.handlers.get(event);
    if (!set) return;

    const promises: Promise<void>[] = [];
    for (const handler of set) {
      try {
        const result = (handler as Handler<T>)(payload);
        if (result instanceof Promise) promises.push(result);
      } catch (err) {
        // Event handlers must not crash the main flow
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  off<T extends AppEventName>(event: T, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler);
  }

  /** Remove all handlers (useful in tests) */
  clear(): void {
    this.handlers.clear();
  }
}

/** Singleton event bus used by the application */
export const eventBus = new EventBus();
