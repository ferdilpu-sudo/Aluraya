import { z } from 'zod';
import { providerProfileSchema, type ProviderProfile } from './providers';
const profile = providerProfileSchema.shape;
export const llmConnectionSchema = z
  .object({
    id: z.uuid(),
    baseUrl: profile.baseUrl,
    endpoint: profile.endpoint,
    model: profile.model,
    auth: profile.auth,
    timeoutSeconds: profile.timeoutSeconds,
    tokenLimitField: z.enum(['max_completion_tokens', 'max_tokens']),
  })
  .strict()
  .refine((c) => !c.endpoint.includes('{'), 'Endpoint chat harus konkret.');
export type LlmConnection = z.infer<typeof llmConnectionSchema>;
export function llmConnection(
  p: ProviderProfile,
  tokenLimitField: LlmConnection['tokenLimitField'],
): LlmConnection {
  if (p.role !== 'llm' || p.protocol !== 'chat-completions')
    throw new Error('UNSUPPORTED_PROTOCOL');
  return llmConnectionSchema.parse({
    id: p.id,
    baseUrl: p.baseUrl,
    endpoint: p.endpoint,
    model: p.model,
    auth: p.auth,
    timeoutSeconds: p.timeoutSeconds,
    tokenLimitField,
  });
}
export const tariffSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3,8}$/),
    inputPerMillion: z.number().finite().min(0).max(1e9),
    outputPerMillion: z.number().finite().min(0).max(1e9),
    perRequest: z.number().finite().min(0).max(1e9),
    checkedByUser: z.literal(true),
  })
  .strict();
export const llmActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect') }).strict(),
  z.object({ action: z.literal('configure'), connection: llmConnectionSchema }).strict(),
  z
    .object({
      action: z.literal('save_key'),
      key: z
        .string()
        .min(1)
        .max(4096)
        .regex(/^[\x21-\x7E]+$/),
    })
    .strict(),
  z.object({ action: z.literal('remove_key') }).strict(),
  z
    .object({
      action: z.literal('prepare'),
      text: z.string().trim().min(1).max(6000),
      maxTokens: z.number().int().min(1).max(4096),
      tariff: tariffSchema,
    })
    .strict(),
  z.object({ action: z.literal('submit'), approvalId: z.uuid() }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
]);
export const llmErrorSchema = z.enum([
  'BUSY',
  'CONFIG_REQUIRED',
  'KEY_REQUIRED',
  'STORAGE_ERROR',
  'INVALID_APPROVAL',
  'AUTH_REJECTED',
  'RATE_LIMIT',
  'PROVIDER_ERROR',
  'INVALID_RESPONSE',
  'OUTPUT_LIMIT',
  'REQUEST_UNCERTAIN',
  'CANCELLED_UNCERTAIN',
]);
export type LlmErrorCode = z.infer<typeof llmErrorSchema>;
export const llmSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    activity: z.enum(['idle', 'storage', 'request']),
    connection: llmConnectionSchema.nullable(),
    keyPresent: z.boolean(),
    quote: z
      .object({
        id: z.uuid(),
        expiresAt: z.number().int(),
        text: z.string().max(6000),
        maxTokens: z.number().int().min(1).max(4096),
        tariff: tariffSchema,
      })
      .strict()
      .nullable(),
    reply: z
      .object({
        text: z.string().max(6000),
        state: z.enum(['completed', 'incomplete']),
        inputTokens: z.number().int().nonnegative().nullable(),
        outputTokens: z.number().int().nonnegative().nullable(),
      })
      .strict()
      .nullable(),
    error: llmErrorSchema.nullable(),
  })
  .strict();
export type LlmAction = z.infer<typeof llmActionSchema>;
export type LlmSnapshot = z.infer<typeof llmSnapshotSchema>;
export const emptyLlmSnapshot: LlmSnapshot = {
  schemaVersion: 1,
  activity: 'idle',
  connection: null,
  keyPresent: false,
  quote: null,
  reply: null,
  error: null,
};
