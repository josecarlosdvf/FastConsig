import { metricsStore } from "../../shared/middleware/metrics.middleware";
import { OpsRepository } from "./ops.repository";

export class OpsService {
  constructor(private readonly repo: OpsRepository) {}

  async observabilitySnapshot() {
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

  private buildAlertHints(durable: {
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
    deliveredLastHour: number;
  }): Array<{ level: "info" | "warning" | "critical"; message: string }> {
    const alerts: Array<{ level: "info" | "warning" | "critical"; message: string }> = [];
    if (durable.deadLetter > 0) {
      alerts.push({
        level: "critical",
        message: `Há ${durable.deadLetter} eventos em dead-letter.`,
      });
    }
    if (durable.failed > 10) {
      alerts.push({
        level: "warning",
        message: `Há ${durable.failed} eventos falhos aguardando retry.`,
      });
    }
    if (alerts.length === 0) {
      alerts.push({ level: "info", message: "Sem alertas críticos no pipeline durável." });
    }
    return alerts;
  }
}
