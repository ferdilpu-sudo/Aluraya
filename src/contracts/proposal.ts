import { z } from 'zod';
const key = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,39}$/);
const ref = z.union([
  z.string().regex(/^new:[A-Za-z][A-Za-z0-9_-]{0,39}$/),
  z.string().refine((s) => s.startsWith('asset:') && z.uuid().safeParse(s.slice(6)).success),
]);
export const proposalContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    summary: z.string().trim().min(1).max(600),
    warnings: z.array(z.string().trim().min(1).max(300)).max(12),
    assets: z
      .array(
        z
          .object({
            key,
            kind: z.enum(['character', 'location', 'prop']),
            name: z.string().trim().min(1).max(120),
            description: z.string().max(1000),
          })
          .strict(),
      )
      .max(12),
    shots: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(120),
            scene: z.string().trim().min(1).max(80),
            action: z.string().trim().min(1).max(2000),
            dialogue: z.string().max(2000),
            sound: z.string().max(1000),
            camera: z.string().trim().min(1).max(160),
            seconds: z.number().int().min(1).max(600),
            references: z.array(ref).max(30),
          })
          .strict(),
      )
      .max(12),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (!p.assets.length && !p.shots.length)
      ctx.addIssue({ code: 'custom', message: 'Usulan kosong.' });
    if (new Set(p.assets.map((a) => a.key)).size !== p.assets.length)
      ctx.addIssue({ code: 'custom', message: 'Key aset duplikat.' });
    for (const shot of p.shots) {
      if (new Set(shot.references).size !== shot.references.length)
        ctx.addIssue({ code: 'custom', message: 'Referensi shot duplikat.' });
      if (
        shot.references.some(
          (r) => r.startsWith('new:') && !p.assets.some((a) => `new:${a.key}` === r),
        )
      )
        ctx.addIssue({ code: 'custom', message: 'Referensi aset baru tidak ditemukan.' });
    }
  });
export const planSourceSchema = z
  .object({
    projectId: z.uuid(),
    revision: z.number().int().nonnegative(),
    sourceText: z.string().trim().min(1).max(6000),
    sourceKind: z.enum(['idea', 'excerpt', 'full']),
    providerId: z.uuid(),
    model: z.string().min(1).max(200),
    prompt: z.string().max(6000),
  })
  .strict();
export const proposalEnvelopeSchema = z
  .object({ requestId: z.uuid(), source: planSourceSchema, content: proposalContentSchema })
  .strict();
export const planReceiptSchema = z
  .object({
    requestId: z.uuid(),
    sourceRevision: z.number().int().nonnegative(),
    appliedAt: z.number().int().nonnegative(),
    providerId: z.uuid(),
    model: z.string().max(200),
    assetIds: z.array(z.uuid()).max(12),
    shotIds: z.array(z.uuid()).max(12),
  })
  .strict();
export type PlanSource = z.infer<typeof planSourceSchema>;
export type ProposalEnvelope = z.infer<typeof proposalEnvelopeSchema>;
