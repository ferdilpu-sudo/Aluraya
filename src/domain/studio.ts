import { z } from 'zod';

export const assetKinds = { character: 'Karakter', location: 'Lokasi', prop: 'Properti' } as const;
export const stageNames = {
  script: 'Naskah',
  assets: 'Aset',
  board: 'Storyboard',
  review: 'Klip & review',
} as const;
export type Stage = keyof typeof stageNames;
const position = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const assetSchema = z
  .object({
    id: z.uuid(),
    name: z.string().max(120),
    kind: z.enum(['character', 'location', 'prop']),
    description: z.string().max(4000),
    image: z
      .string()
      .max(6000000)
      .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
      .nullable(),
  })
  .strict();
const shotSchema = z
  .object({
    id: z.uuid(),
    title: z.string().max(120),
    scene: z.string().max(80),
    action: z.string().max(4000),
    dialogue: z.string().max(4000),
    sound: z.string().max(2000),
    camera: z.string().max(160),
    seconds: z.number().int().min(1).max(600),
    references: z.array(z.uuid()).max(100),
    review: z.enum(['draft', 'reviewed']),
    position,
  })
  .strict();
export const projectSchema = z
  .object({
    version: z.literal(1),
    id: z.uuid(),
    name: z.string().trim().min(1).max(120),
    updatedAt: z.number().int().nonnegative(),
    ratio: z.enum(['16:9', '9:16']),
    targetSeconds: z.number().int().min(1).max(36000),
    adaptation: z.enum(['preserve', 'adapt', 'expand']),
    script: z.string().max(200000),
    assets: z.array(assetSchema).max(500),
    shots: z.array(shotSchema).max(1000),
  })
  .strict()
  .superRefine((p, ctx) => {
    const ids = [...p.assets, ...p.shots].map((x) => x.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'ID duplikat' });
    const assets = new Set(p.assets.map((a) => a.id));
    if (p.shots.some((s) => s.references.some((id) => !assets.has(id))))
      ctx.addIssue({ code: 'custom', message: 'Referensi tidak ditemukan' });
  });
export type StudioProject = z.infer<typeof projectSchema>;
export type StudioAsset = z.infer<typeof assetSchema>;
export type StudioShot = z.infer<typeof shotSchema>;
export function newProject(name = 'Cerita tanpa judul'): StudioProject {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name,
    updatedAt: Date.now(),
    ratio: '16:9',
    targetSeconds: 60,
    adaptation: 'preserve',
    script: '',
    assets: [],
    shots: [],
  };
}
export function newShot(index: number): StudioShot {
  return {
    id: crypto.randomUUID(),
    title: `Shot ${String(index + 1).padStart(2, '0')}`,
    scene: 'Adegan 1',
    action: '',
    dialogue: '',
    sound: '',
    camera: 'Medium shot · statis',
    seconds: 8,
    references: [],
    review: 'draft',
    position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 330 },
  };
}
export function editShot(shot: StudioShot, patch: Partial<StudioShot>): StudioShot {
  const contentChanged = Object.keys(patch).some((key) => !['position', 'review'].includes(key));
  return { ...shot, ...patch, review: contentChanged ? 'draft' : (patch.review ?? shot.review) };
}
export function removeAsset(project: StudioProject, id: string): StudioProject {
  return {
    ...project,
    assets: project.assets.filter((a) => a.id !== id),
    shots: project.shots.map((s) =>
      s.references.includes(id)
        ? editShot(s, { references: s.references.filter((ref) => ref !== id) })
        : s,
    ),
  };
}
export function shotIssues(shot: StudioShot): string[] {
  return [
    !shot.action.trim() && 'Deskripsi aksi belum diisi',
    !shot.camera.trim() && 'Kamera belum diisi',
  ].filter((x): x is string => Boolean(x));
}

export type ProjectUpdate = (
  next: StudioProject | ((current: StudioProject) => StudioProject),
) => void;
