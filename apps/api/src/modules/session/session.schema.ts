/**
 * Session schemas.
 *
 * Session routes are fully authenticated and rely on path params for IDs.
 * There is currently no request body for these endpoints, but this file
 * exists to satisfy the module-completeness governance check and as a
 * place to add future schemas (e.g. pagination query params).
 */

import { z } from "zod";

/** UUID v4 path parameter validation for session IDs */
export const sessionIdSchema = z.object({
  id: z.string().uuid("ID de sessão inválido"),
});
