import { describe, expect, it } from 'vitest';
import {
  editShot,
  newProject,
  newShot,
  projectSchema,
  removeAsset,
  shotIssues,
} from '../src/domain/studio';
import { importDraft } from '../src/infrastructure/studioStorage';

describe('studio drafts and review boundaries', () => {
  it('keeps positions on reload without claiming provider approval', () => {
    const project = newProject('Cerita');
    project.shots = [{ ...newShot(0), position: { x: -150, y: 400 }, action: 'Membuka pintu.' }];
    const restored = projectSchema.parse(JSON.parse(JSON.stringify(project)));
    expect(restored.shots[0]?.position).toEqual({ x: -150, y: 400 });
    expect(restored.shots[0]?.review).toBe('draft');
    expect(projectSchema.safeParse({ ...project, approvalId: crypto.randomUUID() }).success).toBe(
      false,
    );
  });
  it('invalidates review after content edits but preserves it for layout edits', () => {
    const reviewed = { ...newShot(0), review: 'reviewed' as const };
    expect(editShot(reviewed, { dialogue: 'Halo.' }).review).toBe('draft');
    expect(editShot(reviewed, { position: { x: 20, y: 40 } }).review).toBe('reviewed');
  });
  it('removes only affected references and invalidates their reviewed plans', () => {
    const project = newProject();
    const id = crypto.randomUUID();
    project.assets = [{ id, name: 'Lokasi', kind: 'location', description: '', image: null }];
    project.shots = [
      { ...newShot(0), references: [id], review: 'reviewed' },
      { ...newShot(1), review: 'reviewed' },
    ];
    const next = removeAsset(project, id);
    expect(next.shots[0]?.references).toEqual([]);
    expect(next.shots.map((s) => s.review)).toEqual(['draft', 'reviewed']);
    expect(project.assets).toHaveLength(1);
  });
  it('rejects dangling references, duplicate IDs, remote media and secret fields', () => {
    const project = newProject();
    const shot = newShot(0);
    expect(projectSchema.safeParse({ ...project, shots: [shot, shot] }).success).toBe(false);
    expect(
      projectSchema.safeParse({
        ...project,
        shots: [{ ...shot, references: [crypto.randomUUID()] }],
      }).success,
    ).toBe(false);
    expect(projectSchema.safeParse({ ...project, apiKey: 'secret' }).success).toBe(false);
    expect(
      projectSchema.safeParse({
        ...project,
        assets: [
          {
            id: crypto.randomUUID(),
            name: 'A',
            kind: 'prop',
            description: '',
            image: 'https://untrusted.example/image.png',
          },
        ],
      }).success,
    ).toBe(false);
  });
  it('imports a copy without overwriting the source project or reference identity', async () => {
    const project = newProject('Asli');
    const file = new File([JSON.stringify(project)], 'draft.json', { type: 'application/json' });
    const copy = await importDraft(file);
    expect(copy.id).not.toBe(project.id);
    expect(copy.name).toBe('Asli (salinan)');
    expect(project.name).toBe('Asli');
    await expect(importDraft(new File(['{"version":99}'], 'bad.json'))).rejects.toThrow(
      'tidak valid',
    );
  });
  it('does not mark incomplete shot structure ready for review', () => {
    const shot = newShot(0);
    expect(shotIssues(shot)).toContain('Deskripsi aksi belum diisi');
    expect(shotIssues({ ...shot, action: 'Berjalan ke jendela.', camera: '' })).toContain(
      'Kamera belum diisi',
    );
    expect(shotIssues({ ...shot, action: 'Berjalan ke jendela.' })).toEqual([]);
  });
});
