import pino from "pino";
import { getContext } from "./request-context";

/**
 * Shared base pino instance.
 *
 * The `mixin` is called at every log-write and automatically merges the
 * current request context fields (`requestId`, `tenantId`, `userId`).
 * Because it reads from AsyncLocalStorage at call time, all child loggers
 * created from this base pick up the right context per-request without any
 * prop-drilling.
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  mixin() {
    const ctx = getContext();
    if (!ctx) return {};
    return {
      requestId: ctx.requestId,
      ...(ctx.traceId !== undefined ? { traceId: ctx.traceId } : {}),
      ...(ctx.spanId !== undefined ? { spanId: ctx.spanId } : {}),
      ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {}),
      ...(ctx.userId !== undefined ? { userId: ctx.userId } : {}),
    };
  },
  ...(process.env.NODE_ENV === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

/**
 * Logger factory for FastConsig.
 *
 * Returns a child of the shared base logger, so every log line emitted by
 * this child automatically includes the current request context fields.
 *
 * Usage:
 *   import { createLogger } from "@fastconsig/core";
 *   const log = createLogger("user-service");
 *   log.info({ action: "create_user" }, "user criado");
 *   // → { module: "user-service", requestId: "...", tenantId: "...", userId: "...", action: "create_user" }
 */
export function createLogger(module: string, bindings?: Record<string, unknown>) {
  return baseLogger.child({ module, ...bindings });
}

/** Application-level logger (no module binding). */
export const logger = createLogger("app");
