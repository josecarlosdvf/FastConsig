import { Request, Response, NextFunction } from "express";

/** Matches UUID v4 path segments (e.g. /550e8400-e29b-41d4-a716-446655440000) */
const UUID_PATH_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

interface RouteStats {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

interface MetricsSnapshot {
  uptime: number;
  totalRequests: number;
  activeRequests: number;
  statusCodes: Record<string, number>;
  routes: Record<string, { count: number; errors: number; avgMs: number; maxMs: number }>;
}

class MetricsStore {
  readonly startedAt = Date.now();
  totalRequests = 0;
  activeRequests = 0;
  readonly statusCodes: Record<string, number> = {};
  readonly routes: Record<string, RouteStats> = {};

  private routeKey(req: Request): string {
    // Use Express route pattern when available, fall back to replacing UUID-shaped
    // path segments (8-4-4-4-12 hex groups) with a `:id` placeholder.
    const pattern =
      (req.route?.path as string | undefined) ??
      req.path.replace(UUID_PATH_RE, "/:id");
    return `${req.method} ${pattern}`;
  }

  private statusBucket(statusCode: number): string {
    if (statusCode >= 500) return "5xx";
    if (statusCode >= 400) return "4xx";
    if (statusCode >= 300) return "3xx";
    return "2xx";
  }

  record(req: Request, statusCode: number, durationMs: number): void {
    this.totalRequests += 1;

    const bucket = this.statusBucket(statusCode);
    this.statusCodes[bucket] = (this.statusCodes[bucket] ?? 0) + 1;

    const key = this.routeKey(req);
    const existing = this.routes[key] ?? { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
    existing.count += 1;
    if (statusCode >= 400) existing.errors += 1;
    existing.totalMs += durationMs;
    if (durationMs > existing.maxMs) existing.maxMs = durationMs;
    this.routes[key] = existing;
  }

  snapshot(): MetricsSnapshot {
    const routes: MetricsSnapshot["routes"] = {};
    for (const [key, stats] of Object.entries(this.routes)) {
      routes[key] = {
        count: stats.count,
        errors: stats.errors,
        avgMs: stats.count > 0 ? Math.round(stats.totalMs / stats.count) : 0,
        maxMs: stats.maxMs,
      };
    }
    return {
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      totalRequests: this.totalRequests,
      activeRequests: this.activeRequests,
      statusCodes: { ...this.statusCodes },
      routes,
    };
  }
}

export const metricsStore = new MetricsStore();

/**
 * Metrics middleware.
 *
 * Tracks per-request timing and status code counts. Mount before all routes
 * so that every request is captured.
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  metricsStore.activeRequests += 1;

  res.on("finish", () => {
    metricsStore.activeRequests = Math.max(0, metricsStore.activeRequests - 1);
    metricsStore.record(req, res.statusCode, Date.now() - start);
  });

  next();
}
