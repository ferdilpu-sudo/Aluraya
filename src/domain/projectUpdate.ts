import { projectSchema, type ProjectUpdate, type StudioProject } from './studio';
export function commitProjectUpdate(
  current: StudioProject,
  next: Parameters<ProjectUpdate>[0],
): StudioProject {
  const candidate = typeof next === 'function' ? next(current) : next;
  if (candidate.id !== current.id)
    throw new Error('Proyek aktif berubah. Buka ulang detail yang akan disunting.');
  const value = { ...candidate, revision: current.revision + 1, updatedAt: Date.now() };
  if (
    value.script !== current.script ||
    value.ratio !== current.ratio ||
    value.adaptation !== current.adaptation
  )
    value.shots = value.shots.map((shot) => ({ ...shot, review: 'draft' }));
  return projectSchema.parse(value);
}
