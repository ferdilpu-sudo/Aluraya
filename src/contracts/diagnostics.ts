import { z } from 'zod';

export const checkSchema = z
  .object({
    id: z.enum(['host', 'sidecar', 'chatgpt', 'providers', 'generation']),
    label: z.string().min(1).max(80),
    state: z.enum(['pass', 'blocked', 'not_run']),
    detail: z.string().min(1).max(500),
  })
  .strict();

export const diagnosticsSchema = z
  .object({
    schemaVersion: z.literal(1),
    runtime: z.enum(['desktop', 'browser']),
    checkedAt: z.iso.datetime(),
    platform: z.string().min(1).max(40),
    nodeVersion: z.string().max(40).nullable(),
    checks: z
      .array(checkSchema)
      .length(5)
      .refine(
        (checks) => new Set(checks.map((check) => check.id)).size === 5,
        'Duplicate diagnostic check',
      ),
  })
  .strict();

export type Diagnostics = z.infer<typeof diagnosticsSchema>;
export type DiagnosticCheck = z.infer<typeof checkSchema>;
