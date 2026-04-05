import { api } from "./api";

export interface OpsSnapshot {
  metrics: {
    requestsTotal: number;
    requestsByMethod: Record<string, number>;
    requestsByStatusRange: Record<string, number>;
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    activeRequests: number;
    startedAt: string;
  };
  durableEvents: {
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
    deliveredLastHour: number;
  };
  tracing: {
    headers: string[];
    status: "enabled";
  };
  alerts: Array<{ level: "info" | "warning" | "critical"; message: string }>;
}

export const opsApi = {
  observability: (tenantId: string, token: string): Promise<OpsSnapshot> =>
    api.get<OpsSnapshot>("/api/ops/observability", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
  prometheus: (tenantId: string, token: string): Promise<string> =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/ops/prometheus`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.text();
    }),
};

