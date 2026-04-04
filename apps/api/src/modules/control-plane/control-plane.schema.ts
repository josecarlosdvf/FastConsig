import { z } from "zod";

export const listControlPlanePagesQuerySchema = z.object({
  tenantId: z.string().optional(),
});
