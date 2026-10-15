import { z } from 'zod';

const promptSchema = z
  .string()
  .trim()
  .min(1)
  .max(4000)
  .refine(
    (text) => !Array.from(text).some((c) => c.charCodeAt(0) < 32 && !'\n\r\t'.includes(c)),
    'Invalid control character',
  );
export const generationSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('img'),
      prompt: promptSchema,
      aspect: z.union([z.literal(1), z.literal(2), z.literal(5)]),
    })
    .strict(),
  z
    .object({
      mode: z.literal('t2v'),
      prompt: promptSchema,
      ratio: z.union([z.literal(1), z.literal(2)]),
      resolution: z.union([z.literal(720), z.literal(1080)]),
    })
    .strict(),
]);
export const apiKeySchema = z.string().regex(/^nxb_[A-Za-z0-9_-]{16,252}$/);
export const nexaActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect') }).strict(),
  z.object({ action: z.literal('pause') }).strict(),
  z.object({ action: z.literal('save_key'), key: apiKeySchema }).strict(),
  z.object({ action: z.literal('remove_key') }).strict(),
  z.object({ action: z.literal('credit') }).strict(),
  z.object({ action: z.literal('prepare'), input: generationSchema }).strict(),
  z.object({ action: z.literal('submit'), approvalId: z.uuid() }).strict(),
  z.object({ action: z.literal('resume'), id: z.uuid() }).strict(),
  z.object({ action: z.literal('history'), page: z.number().int().min(0).max(100000) }).strict(),
]);
export const nexaErrorSchema = z.enum([
  'KEY_REQUIRED',
  'INVALID_KEY',
  'INSUFFICIENT_CREDIT',
  'ACCESS_DENIED',
  'NOT_FOUND',
  'RATE_LIMIT',
  'INVALID_REQUEST',
  'NETWORK_ERROR',
  'PROVIDER_ERROR',
  'PROTOCOL_ERROR',
  'STORAGE_ERROR',
  'BUSY',
  'APPROVAL_STALE',
  'COST_CHANGED',
  'SUBMIT_UNCERTAIN',
  'JOB_FAILED',
  'DOWNLOAD_FAILED',
  'DOWNLOAD_REDIRECT',
  'MEDIA_INVALID',
  'KEY_MISMATCH',
]);
export const creditSchema = z
  .object({
    balance: z.number().finite().nonnegative(),
    cost: z.number().finite().positive(),
    checkedAt: z.number().int().nonnegative(),
  })
  .strict();
export const quoteSchema = z
  .object({
    id: z.uuid(),
    input: generationSchema,
    cost: z.number().positive(),
    expiresAt: z.number().int(),
  })
  .strict();
export const mediaSchema = z
  .object({
    fileName: z.string().regex(/^[0-9a-f-]{36}\.(jpg|mp4)$/),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    bytes: z.number().int().positive(),
    mime: z.enum(['image/jpeg', 'video/mp4']),
  })
  .strict();
export const jobSchema = z
  .object({
    id: z.uuid(),
    providerId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .nullable(),
    input: generationSchema,
    cost: z.number().positive(),
    createdAt: z.number().int(),
    chargedCost: z.number().finite().nonnegative().nullable(),
    state: z.enum(['submitting', 'uncertain', 'queued', 'processing', 'done', 'ready', 'failed']),
    error: nexaErrorSchema.nullable(),
    media: mediaSchema.nullable(),
  })
  .strict();
export const nexaSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    activity: z.enum([
      'idle',
      'loading',
      'saving',
      'credit',
      'preparing',
      'submitting',
      'monitoring',
    ]),
    configured: z.boolean(),
    credit: creditSchema.nullable(),
    quote: quoteSchema.nullable(),
    jobs: z.array(jobSchema).max(3),
    jobCount: z.number().int().nonnegative(),
    page: z.number().int().nonnegative(),
    activeId: z.uuid().nullable(),
    error: nexaErrorSchema.nullable(),
  })
  .strict();
export type GenerationInput = z.infer<typeof generationSchema>;
export type NexaAction = z.infer<typeof nexaActionSchema>;
export type NexaSnapshot = z.infer<typeof nexaSnapshotSchema>;
export type NexaJob = z.infer<typeof jobSchema>;
export type NexaMedia = z.infer<typeof mediaSchema>;
export type NexaErrorCode = z.infer<typeof nexaErrorSchema>;
