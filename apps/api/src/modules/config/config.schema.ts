import { z } from "zod";

const jsonValueSchema: z.ZodType<Record<string, unknown>> = z.record(z.unknown());

export const configPrimitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  jsonValueSchema,
]);

export const updateConfigEntrySchema = z.object({
  key: z.string().min(3),
  value: configPrimitiveValueSchema,
});

export const updateConfigSchema = z.object({
  entries: z.array(updateConfigEntrySchema).min(1),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;

