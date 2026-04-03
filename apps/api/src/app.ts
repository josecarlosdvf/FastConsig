import express from "express";
import cors from "cors";
import { tenantMiddleware } from "./shared/middleware/tenant.middleware";
import { errorHandler } from "./shared/middleware/error.middleware";
import { authRouter } from "./modules/auth/auth.router";
import { userRouter } from "./modules/user/user.router";
import { tenantRouter } from "./modules/tenant/tenant.router";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tenants", tenantRouter);
  app.use("/api/users", tenantMiddleware, userRouter);

  app.use(errorHandler);

  return app;
}
