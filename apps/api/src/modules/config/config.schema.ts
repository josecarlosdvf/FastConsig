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

export const listConfigVersionsParamsSchema = z.object({
  scope: z.enum(["system", "tenant"]),
  key: z.string().min(3),
});

export const rollbackConfigSchema = z.object({
  scope: z.enum(["system", "tenant"]),
  key: z.string().min(3),
  version: z.number().int().min(1),
});

export type RollbackConfigInput = z.infer<typeof rollbackConfigSchema>;

export const rollbackConfigRequestSchema = z.object({
  entries: z.array(
    z.object({
      scope: z.enum(["system", "tenant"]),
      key: z.string().min(3),
      version: z.number().int().min(1),
    })
  ).min(1),
});
