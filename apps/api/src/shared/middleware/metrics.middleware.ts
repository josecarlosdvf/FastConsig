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

interface DurableMetricsSnapshot {
  pending: number;
  processing: number;
  failed: number;
  deadLetter: number;
  deliveredLastHour: number;
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

  prometheusSnapshot(durable?: DurableMetricsSnapshot): string {
    const snapshot = this.snapshot();
    const lines: string[] = [];
    lines.push("# HELP fastconsig_http_requests_total Total HTTP requests processed.");
    lines.push("# TYPE fastconsig_http_requests_total counter");
    lines.push(`fastconsig_http_requests_total ${snapshot.totalRequests}`);

    lines.push("# HELP fastconsig_http_active_requests Current active HTTP requests.");
    lines.push("# TYPE fastconsig_http_active_requests gauge");
    lines.push(`fastconsig_http_active_requests ${snapshot.activeRequests}`);

    lines.push("# HELP fastconsig_process_uptime_seconds Process uptime in seconds.");
    lines.push("# TYPE fastconsig_process_uptime_seconds gauge");
    lines.push(`fastconsig_process_uptime_seconds ${snapshot.uptime}`);

    lines.push("# HELP fastconsig_http_status_bucket_total Requests aggregated by status bucket.");
    lines.push("# TYPE fastconsig_http_status_bucket_total counter");
    for (const [bucket, count] of Object.entries(snapshot.statusCodes)) {
      lines.push(`fastconsig_http_status_bucket_total{bucket="${bucket}"} ${count}`);
    }

    lines.push("# HELP fastconsig_http_route_requests_total Requests per route pattern.");
    lines.push("# TYPE fastconsig_http_route_requests_total counter");
    lines.push("# HELP fastconsig_http_route_errors_total Errors per route pattern.");
    lines.push("# TYPE fastconsig_http_route_errors_total counter");
    lines.push("# HELP fastconsig_http_route_duration_avg_ms Average route response time in ms.");
    lines.push("# TYPE fastconsig_http_route_duration_avg_ms gauge");
    lines.push("# HELP fastconsig_http_route_duration_max_ms Maximum route response time in ms.");
    lines.push("# TYPE fastconsig_http_route_duration_max_ms gauge");
    for (const [route, stats] of Object.entries(snapshot.routes)) {
      const escapedRoute = route.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`fastconsig_http_route_requests_total{route="${escapedRoute}"} ${stats.count}`);
      lines.push(`fastconsig_http_route_errors_total{route="${escapedRoute}"} ${stats.errors}`);
      lines.push(`fastconsig_http_route_duration_avg_ms{route="${escapedRoute}"} ${stats.avgMs}`);
      lines.push(`fastconsig_http_route_duration_max_ms{route="${escapedRoute}"} ${stats.maxMs}`);
    }

    if (durable) {
      lines.push("# HELP fastconsig_event_outbox_pending Pending events in outbox.");
      lines.push("# TYPE fastconsig_event_outbox_pending gauge");
      lines.push(`fastconsig_event_outbox_pending ${durable.pending}`);

      lines.push("# HELP fastconsig_event_outbox_processing Processing events in outbox.");
      lines.push("# TYPE fastconsig_event_outbox_processing gauge");
      lines.push(`fastconsig_event_outbox_processing ${durable.processing}`);

      lines.push("# HELP fastconsig_event_outbox_failed Failed events waiting retry.");
      lines.push("# TYPE fastconsig_event_outbox_failed gauge");
      lines.push(`fastconsig_event_outbox_failed ${durable.failed}`);

      lines.push("# HELP fastconsig_event_outbox_dead_letter Events moved to dead-letter queue.");
      lines.push("# TYPE fastconsig_event_outbox_dead_letter gauge");
      lines.push(`fastconsig_event_outbox_dead_letter ${durable.deadLetter}`);

      lines.push("# HELP fastconsig_event_outbox_delivered_last_hour Delivered events in last hour.");
      lines.push("# TYPE fastconsig_event_outbox_delivered_last_hour gauge");
      lines.push(`fastconsig_event_outbox_delivered_last_hour ${durable.deliveredLastHour}`);
    }

    return `${lines.join("\n")}\n`;
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
