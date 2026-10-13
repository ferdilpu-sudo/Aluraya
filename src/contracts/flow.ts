import { z } from 'zod';

export const flowActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect') }).strict(),
  z.object({ action: z.literal('create'), browser: z.enum(['chrome', 'msedge']) }).strict(),
  z.object({ action: z.literal('open'), profileId: z.uuid() }).strict(),
  z.object({ action: z.literal('observe') }).strict(),
  z.object({ action: z.literal('close') }).strict(),
  z.object({ action: z.literal('profiles'), page: z.number().int().min(0).max(100000) }).strict(),
]);
export const flowObservationSchema = z
  .object({
    observedAt: z.iso.datetime(),
    page: z.enum(['flow', 'login', 'other', 'closed']),
    editorVisible: z.boolean(),
    modelLabels: z.array(z.string().max(100)).max(12),
    creditLabels: z.array(z.string().max(100)).max(6),
    costVerified: z.literal(false),
  })
  .strict();
export const flowSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    activity: z.enum(['idle', 'loading', 'opening', 'observing', 'closing']),
    profiles: z
      .array(z.object({ id: z.uuid(), browser: z.enum(['chrome', 'msedge']) }).strict())
      .max(10),
    profileCount: z.number().int().nonnegative(),
    profilePage: z.number().int().nonnegative(),
    activeProfileId: z.uuid().nullable(),
    browserOpen: z.boolean(),
    observation: flowObservationSchema.nullable(),
    generationReady: z.literal(false),
    error: z
      .enum([
        'WINDOWS_REQUIRED',
        'STORAGE_ERROR',
        'BROWSER_OPEN_FAILED',
        'NAVIGATION_FAILED',
        'BROWSER_CLOSED',
        'PROFILE_ACTIVE',
        'PROFILE_NOT_FOUND',
        'OBSERVATION_FAILED',
        'BUSY',
      ])
      .nullable(),
  })
  .strict();
export type FlowAction = z.infer<typeof flowActionSchema>;
export type FlowSnapshot = z.infer<typeof flowSnapshotSchema>;
export type FlowObservation = z.infer<typeof flowObservationSchema>;
