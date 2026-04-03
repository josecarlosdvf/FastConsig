import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createLogger } from "@fastconsig/core";
import { RequestWithId } from "./request-id.middleware";

const log = createLogger("error-handler");

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as RequestWithId).requestId;

  if (err instanceof ZodError) {
    res.status(422).json({
      error: "Dados inválidos",
      issues: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Error) {
    const status =
      (err as Error & { statusCode?: number }).statusCode ?? 500;

    if (status >= 500) {
      log.error({ requestId, err }, err.message);
    } else {
      log.warn({ requestId, status }, err.message);
    }

    if (process.env.NODE_ENV !== "production") {
      res.status(status).json({ error: err.message, stack: err.stack });
      return;
    }

    res.status(status).json({ error: err.message });
    return;
  }

  log.error({ requestId, err }, "Unexpected error");
  res.status(500).json({ error: "Erro interno do servidor" });
}
