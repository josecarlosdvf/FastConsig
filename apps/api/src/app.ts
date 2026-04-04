import express, { Application } from "express";
import cors from "cors";
import { pluginRegistry } from "@fastconsig/core";
import { requestIdMiddleware } from "./shared/middleware/request-id.middleware";
import { contextMiddleware } from "./shared/middleware/context.middleware";
import { metricsMiddleware, metricsStore } from "./shared/middleware/metrics.middleware";
import { tenantMiddleware } from "./shared/middleware/tenant.middleware";
import { errorHandler } from "./shared/middleware/error.middleware";
import { authRouter } from "./modules/auth/auth.router";
import { userRouter } from "./modules/user/user.router";
import { tenantRouter } from "./modules/tenant/tenant.router";
import { sessionRouter } from "./modules/session/session.router";
import { configRouter } from "./modules/config/config.router";
import { controlPlaneRouter } from "./modules/control-plane/control-plane.router";
import { controlPlaneCorePlugin } from "./plugins/control-plane-core.plugin";
import { learningSystemPlugin } from "./plugins/learning-system.plugin";
import { monetizationCorePlugin } from "./plugins/monetization-core.plugin";
import { monetizationPaymentsPlugin } from "./plugins/monetization-payments.plugin";
import { auditRouter } from "./modules/audit/audit.router";
import { eventsRouter, eventsService } from "./modules/events/events.router";
import { opsRouter } from "./modules/ops/ops.router";
import { OpsService } from "./modules/ops/ops.service";
import { OpsRepository } from "./modules/ops/ops.repository";

export async function createApp(): Promise<Application> {
  const app = express();
  const opsService = new OpsService(new OpsRepository());

  if (process.env.NODE_ENV === "production" && !process.env.METRICS_TOKEN) {
    // eslint-disable-next-line no-console
    console.warn("METRICS_TOKEN is not set in production; /metrics will return 503.");
  }

  // Order matters: requestId → context → metrics → cors/json → routes
  app.use(requestIdMiddleware);
  app.use(contextMiddleware);
  app.use(metricsMiddleware);
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/metrics", (_req, res) => {
    res.json(metricsStore.snapshot());
  });

  app.get("/metrics", (req, res) => {
    const token = process.env.METRICS_TOKEN;
    if (process.env.NODE_ENV === "production" && !token) {
      res.status(503).json({ error: "Service temporarily unavailable" });
      return;
    }
    if (token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${token}`) {
        res.status(401).json({ error: "Unauthorized metrics access" });
        return;
      }
    }

    void opsService
      .durableMetricsSnapshot()
      .then((durable) => {
        res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
        res.send(metricsStore.prometheusSnapshot(durable));
      })
      .catch(() => {
        res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
        res.send(metricsStore.prometheusSnapshot());
      });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tenants", tenantRouter);
  app.use("/api/users", tenantMiddleware, userRouter);
  app.use("/api/sessions", sessionRouter);
  app.use("/api/config", configRouter);
  app.use("/api/control-plane", controlPlaneRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/ops", opsRouter);

  // Bootstrap registered plugins
  pluginRegistry.register(controlPlaneCorePlugin);
  pluginRegistry.register(learningSystemPlugin);
  pluginRegistry.register(monetizationCorePlugin);
  pluginRegistry.register(monetizationPaymentsPlugin);
  await pluginRegistry.bootstrap(app);
  eventsService.startWorker();

  app.use(errorHandler);

  return app;
}
