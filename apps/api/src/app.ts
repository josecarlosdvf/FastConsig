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

export async function createApp(): Promise<Application> {
  const app = express();

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

  app.use("/api/auth", authRouter);
  app.use("/api/tenants", tenantRouter);
  app.use("/api/users", tenantMiddleware, userRouter);
  app.use("/api/sessions", sessionRouter);
  app.use("/api/config", configRouter);

  // Bootstrap registered plugins
  await pluginRegistry.bootstrap(app);

  app.use(errorHandler);

  return app;
}
