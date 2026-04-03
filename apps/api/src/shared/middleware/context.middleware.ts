import { Request, Response, NextFunction } from "express";
import { runWithContext } from "@fastconsig/core";
import { RequestWithId } from "./request-id.middleware";

/**
 * Starts an AsyncLocalStorage context for each incoming request.
 *
 * Must be registered AFTER `requestIdMiddleware` so that `req.requestId`
 * is already populated. All downstream middleware and route handlers run
 * inside this context and can read it via `getContext()`.
 *
 * `tenantMiddleware` and `authMiddleware` enrich the same context object with
 * `tenantId` and `userId` respectively — no additional scope is needed.
 *
 * Note: `next` is called inside the context via an arrow wrapper so that the
 * AsyncLocalStorage scope remains active for the entire async call chain,
 * including downstream error handlers.
 */
export function contextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const requestId = (req as RequestWithId).requestId;
  runWithContext({ requestId }, () => next());
}
