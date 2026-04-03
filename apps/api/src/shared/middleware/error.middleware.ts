import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
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

    if (process.env.NODE_ENV !== "production") {
      res.status(status).json({ error: err.message, stack: err.stack });
      return;
    }

    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Erro interno do servidor" });
}
