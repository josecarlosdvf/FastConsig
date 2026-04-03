import express, { Application } from "express";
import cors from "cors";
import { pluginRegistry } from "@fastconsig/core";
import { tenantMiddleware } from "./shared/middleware/tenant.middleware";
import { errorHandler } from "./shared/middleware/error.middleware";
import { requestIdMiddleware } from "./shared/middleware/request-id.middleware";
import { authRouter } from "./modules/auth/auth.router";
import { userRouter } from "./modules/user/user.router";
import { tenantRouter } from "./modules/tenant/tenant.router";
import { sessionRouter } from "./modules/session/session.router";

export async function createApp(): Promise<Application> {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tenants", tenantRouter);
  app.use("/api/users", tenantMiddleware, userRouter);
  app.use("/api/sessions", sessionRouter);

  // Bootstrap registered plugins
  await pluginRegistry.bootstrap(app);

  app.use(errorHandler);

  return app;
}
