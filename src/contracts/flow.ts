import { z } from 'zod';

export const flowActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect') }).strict(),
  z.object({ action: z.literal('create') }).strict(),
  z.object({ action: z.literal('open'), profileId: z.uuid() }).strict(),
  z.object({ action: z.literal('observe') }).strict(),
  z.object({ action: z.literal('close') }).strict(),
  z.object({ action: z.literal('profiles'), page: z.number().int().min(0).max(100000) }).strict(),
]);
export const flowSnapshotSchema = z
  .object({
    schemaVersion: z.literal(2),
    runtime: z.literal('webview2'),
    profiles: z.array(z.object({ id: z.uuid() }).strict()).max(10),
    profileCount: z.number().int().nonnegative(),
    profilePage: z.number().int().nonnegative(),
    activeProfileId: z.uuid().nullable(),
    browserOpen: z.boolean(),
    observation: z
      .object({
        checkedAtMs: z.number().int().nonnegative(),
        page: z.enum(['flow', 'login', 'login_rejected', 'other', 'closed']),
        origin: z.string().max(200).nullable(),
      })
      .strict()
      .nullable(),
    generationReady: z.literal(false),
    error: z.enum(['NAVIGATION_BLOCKED', 'POPUP_BLOCKED', 'POPUP_FAILED']).nullable(),
  })
  .strict();
export type FlowAction = z.infer<typeof flowActionSchema>;
export type FlowSnapshot = z.infer<typeof flowSnapshotSchema>;
