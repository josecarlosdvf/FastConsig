import { z } from "zod";

export const replayDeadLetterSchema = z.object({
  id: z.string().uuid(),
});

export type ReplayDeadLetterInput = z.infer<typeof replayDeadLetterSchema>;
