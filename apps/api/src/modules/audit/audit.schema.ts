import { z } from "zod";

export const listAuditQuerySchema = z.object({
  eventName: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
