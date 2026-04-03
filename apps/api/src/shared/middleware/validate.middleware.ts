import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Route-level validation middleware factory.
 *
 * Validates `req.body` against the provided Zod schema **before** the route
 * handler runs. On success, replaces `req.body` with the parsed (type-safe)
 * value. On failure, forwards a `ZodError` to the Express error handler which
 * returns a structured 422 response.
 *
 * Usage:
 *   router.post("/", validate(createUserSchema), (req, res) => controller.create(req, res));
 *
 * Controllers can then read `req.body` directly without calling `.parse()` again.
 *
 * ⚠️  Always mount this middleware BEFORE the controller handler.
 *     Never call `schema.parse(req.body)` inside a controller.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Same as `validate` but validates `req.params` instead of `req.body`.
 * Useful for route-parameter validation (e.g. UUID format check).
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.params = result.data as unknown as Record<string, string>;
    next();
  };
}

export type { ZodError };
