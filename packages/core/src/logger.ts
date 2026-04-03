import pino from "pino";

/**
 * Logger factory for FastConsig.
 *
 * Usage:
 *   import { createLogger } from "@fastconsig/core";
 *   const logger = createLogger("my-module");
 *   logger.info({ tenantId, userId }, "user created");
 *
 * Child loggers bind fixed fields so every log line includes the module name
 * and any context passed at creation time.
 */
export function createLogger(module: string, bindings?: Record<string, unknown>) {
  const base = pino({
    level: process.env.LOG_LEVEL ?? "info",
    ...(process.env.NODE_ENV === "production"
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
          },
        }),
  });

  return base.child({ module, ...bindings });
}

/** Application-level logger (no module binding) */
export const logger = createLogger("app");
