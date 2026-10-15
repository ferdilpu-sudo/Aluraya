import { z } from 'zod';
import { diagnosticsSchema } from './diagnostics';
import { chatActionSchema } from './chat';
import { nexaActionSchema } from './nexabot';

export const MAX_FRAME_BYTES = 65_536;
const healthRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    requestId: z.uuid(),
    type: z.literal('health.inspect'),
    payload: z.object({}).strict(),
  })
  .strict();

export const requestSchema = z.union([
  healthRequestSchema,
  z
    .object({
      schemaVersion: z.literal(1),
      requestId: z.uuid(),
      type: z.literal('nexabot.action'),
      payload: nexaActionSchema,
    })
    .strict(),
  z
    .object({
      schemaVersion: z.literal(1),
      requestId: z.uuid(),
      type: z.literal('chat.action'),
      payload: chatActionSchema,
    })
    .strict(),
]);

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
