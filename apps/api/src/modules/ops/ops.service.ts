import { metricsStore } from "../../shared/middleware/metrics.middleware";
import { OpsRepository } from "./ops.repository";

interface DurableEventsSnapshot {
  pending: number;
  processing: number;
  failed: number;
  deadLetter: number;
  deliveredLastHour: number;
}

const FAILED_EVENTS_WARNING_THRESHOLD = 10;

interface ObservabilitySnapshot {
  metrics: ReturnType<typeof metricsStore.snapshot>;
  durableEvents: DurableEventsSnapshot;
  tracing: {
    headers: string[];
    status: "enabled";
  };
  alerts: Array<{ level: "info" | "warning" | "critical"; message: string }>;
}

export class OpsService {
  constructor(private readonly repo: OpsRepository) {}

  async observabilitySnapshot(): Promise<ObservabilitySnapshot> {
    const durable = await this.repo.durablePipelineHealth();
    return {
      metrics: metricsStore.snapshot(),
      durableEvents: durable,
      tracing: {
        headers: ["x-trace-id", "x-span-id", "x-request-id"],
        status: "enabled",
      },
      alerts: this.buildAlertHints(durable),
    };
  }

  async durableMetricsSnapshot(): Promise<DurableEventsSnapshot> {
    return this.repo.durablePipelineHealth();
  }

  private buildAlertHints(
    durable: DurableEventsSnapshot
  ): Array<{ level: "info" | "warning" | "critical"; message: string }> {
    const alerts: Array<{ level: "info" | "warning" | "critical"; message: string }> = [];
    if (durable.deadLetter > 0) {
      alerts.push({
        level: "critical",
        message: `Há ${durable.deadLetter} eventos em dead-letter.`,
      });
    }
    if (durable.failed > FAILED_EVENTS_WARNING_THRESHOLD) {
      alerts.push({
        level: "warning",
        message: `Há ${durable.failed} eventos falhos aguardando retry (limiar ${FAILED_EVENTS_WARNING_THRESHOLD}).`,
      });
    }
    if (alerts.length === 0) {
      alerts.push({ level: "info", message: "Sem alertas críticos no pipeline durável." });
    }
    return alerts;
  }
}
