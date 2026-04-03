import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "x-request-id";

export interface RequestWithId extends Request {
  requestId: string;
}

/**
 * Attaches a unique requestId to every incoming request.
 *
 * - Reads `X-Request-ID` from incoming headers (allows tracing across services)
 * - Falls back to a newly generated UUID v4
 * - Echoes the ID back in the response as `X-Request-ID`
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID();

  (req as RequestWithId).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
