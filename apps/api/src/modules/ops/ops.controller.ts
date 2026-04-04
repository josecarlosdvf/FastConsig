import { Request, Response } from "express";
import { OpsService } from "./ops.service";
import { metricsStore } from "../../shared/middleware/metrics.middleware";

export class OpsController {
  constructor(private readonly service: OpsService) {}

  async observability(_req: Request, res: Response): Promise<void> {
    res.json(await this.service.observabilitySnapshot());
  }

  async prometheusMetrics(_req: Request, res: Response): Promise<void> {
    const durable = await this.service.durableMetricsSnapshot();
    res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metricsStore.prometheusSnapshot(durable));
  }
}
