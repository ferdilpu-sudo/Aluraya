import { z } from 'zod';
import { chatDiagnosticSchema } from './chatDiagnostic';

export const chatActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect') }).strict(),
  z.object({ action: z.literal('login'), addAccount: z.boolean() }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z.object({ action: z.literal('logout') }).strict(),
  z.object({ action: z.literal('usage') }).strict(),
  z.object({ action: z.literal('models') }).strict(),
  z.object({ action: z.literal('confirm_plan') }).strict(),
  z.object({ action: z.literal('clear') }).strict(),
  z.object({ action: z.literal('bridge_enable') }).strict(),
  z.object({ action: z.literal('bridge_disable') }).strict(),
  z.object({ action: z.literal('accounts'), page: z.number().int().min(0).max(100000) }).strict(),
  z.object({ action: z.literal('select'), accountId: z.uuid() }).strict(),
  z
    .object({
      action: z.literal('send'),
      model: z.string().min(1).max(200),
      text: z.string().trim().min(1).max(4000),
    })
    .strict(),
]);
export const chatErrorSchema = z.enum([
  'WINDOWS_REQUIRED',
  'STORAGE_ERROR',
  'SESSION_IN_USE',
  'NETWORK_ERROR',
  'PROVIDER_ERROR',
  'LOGIN_CANCELLED',
  'LOGIN_TIMEOUT',
  'LOGIN_DENIED',
  'INVALID_CALLBACK',
  'INVALID_IDENTITY',
  'LOGIN_REQUIRED',
  'PLAN_PERMISSION_REQUIRED',
  'PLAN_CONFIRMATION_REQUIRED',
  'USAGE_LIMIT',
  'USAGE_UNAVAILABLE',
  'NOT_ELIGIBLE',
  'ACCESS_DENIED',
  'UNSUPPORTED_REQUEST',
  'INVALID_MODEL',
  'BUSY',
  'STREAM_INTERRUPTED',
  'RESPONSE_INCOMPLETE',
  'OUTPUT_LIMIT',
  'CONTEXT_LIMIT',
  'REVOCATION_UNCONFIRMED',
]);
export const chatSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    activity: z.enum(['idle', 'loading', 'login', 'models', 'reply', 'logout']),
    accountId: z.uuid().nullable(),
    email: z.string().max(320).nullable(),
    signedIn: z.boolean(),
    planEnabled: z.boolean(),
    planConfirmed: z.boolean(),
    welcomePending: z.boolean(),
    usagePaused: z.boolean(),
    bridgeActive: z.boolean().optional(),
    bridgeCode: z
      .string()
      .regex(/^[A-Za-z0-9_-]{43}$/)
      .nullable()
      .optional(),
    accounts: z.array(z.object({ id: z.uuid(), label: z.string().max(380) }).strict()).max(10),
    accountCount: z.number().int().nonnegative(),
    accountPage: z.number().int().nonnegative(),
    models: z
      .array(
        z.object({ id: z.string().min(1).max(200), name: z.string().min(1).max(200) }).strict(),
      )
      .max(100),
    reply: z
      .object({
        id: z.uuid(),
        text: z.string().max(6000),
        state: z.enum(['streaming', 'completed', 'failed', 'cancelled']),
      })
      .strict()
      .nullable(),
    error: chatErrorSchema.nullable(),
    diagnostic: chatDiagnosticSchema.nullable(),
  })
  .strict();
export type ChatAction = z.infer<typeof chatActionSchema>;
export type ChatSnapshot = z.infer<typeof chatSnapshotSchema>;
export type ChatErrorCode = z.infer<typeof chatErrorSchema>;
