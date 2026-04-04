import { z } from "zod";

export const listAuditQuerySchema = z.object({
  eventName: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
}).superRefine((value, ctx) => {
  if (value.from && value.to) {
    const from = new Date(value.from).getTime();
    const to = new Date(value.to).getTime();
    if (from > to) {
      ctx.addIssue({
        code: "custom",
        message: "`from` deve ser menor ou igual a `to`.",
        path: ["from"],
      });
    }
  }
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
