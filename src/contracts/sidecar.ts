import { z } from 'zod';
import { diagnosticsSchema } from './diagnostics';

export const MAX_FRAME_BYTES = 65_536;
export const requestSchema = z
  .object({
    schemaVersion: z.literal(1),
    requestId: z.uuid(),
    type: z.literal('health.inspect'),
    payload: z.object({}).strict(),
  })
  .strict();

export const responseSchema = z.discriminatedUnion('ok', [
  z
    .object({
      schemaVersion: z.literal(1),
      requestId: z.uuid(),
      ok: z.literal(true),
      payload: diagnosticsSchema,
    })
    .strict(),
  z
    .object({
      schemaVersion: z.literal(1),
      requestId: z.uuid(),
      ok: z.literal(false),
      error: z.enum(['INVALID_REQUEST', 'INTERNAL_ERROR']),
    })
    .strict(),
]);
export type SidecarRequest = z.infer<typeof requestSchema>;
