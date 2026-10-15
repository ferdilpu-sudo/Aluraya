import { useCallback, useEffect, useRef, useState } from 'react';
import { newProject, type ProjectUpdate, type StudioProject } from '../../domain/studio';
import { loadProjects, saveProject } from '../../infrastructure/studioStorage';

export function useStudio() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const writes = useRef(Promise.resolve());
  const versions = useRef(new Map<string, number>());
  const failures = useRef(new Map<string, string>());
  const outstanding = useRef(0);
  const latest = useRef<StudioProject[]>([]);
  const persist = useCallback((project: StudioProject) => {
    const current = (versions.current.get(project.id) ?? 0) + 1;
    versions.current.set(project.id, current);
    outstanding.current++;
    setSaving(true);
    writes.current = writes.current
      .catch(() => {})
      .then(() => saveProject(project))
      .then(() => {
        if (versions.current.get(project.id) === current) failures.current.delete(project.id);
      })
      .catch((e: unknown) => {
        if (versions.current.get(project.id) === current)
          failures.current.set(project.id, e instanceof Error ? e.message : 'Gagal menyimpan.');
      })
      .finally(() => {
        outstanding.current--;
        setSaving(outstanding.current > 0);
        setError(failures.current.values().next().value ?? '');
      });
  }, []);
  useEffect(() => {
    let cancelled = false;
    void loadProjects()
      .then((items) => {
        if (cancelled) return;
        const initial = items.length ? items : [newProject()];
        latest.current = initial;
        setProjects(initial);
        setActiveId(initial[0]!.id);
        setLoading(false);
        if (!items.length) persist(initial[0]!);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoading(false);
          setError(e instanceof Error ? e.message : 'Gagal membaca draf.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [persist]);
  useEffect(() => {
    if (!saving && !error) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saving, error]);
  const project = projects.find((p) => p.id === activeId);
  const update: ProjectUpdate = (next) => {
    const current = latest.current.find((p) => p.id === activeId);
    if (!current) return;
    const value = { ...(typeof next === 'function' ? next(current) : next), updatedAt: Date.now() };
    if (
      value.script !== current.script ||
      value.ratio !== current.ratio ||
      value.adaptation !== current.adaptation
    ) {
      value.shots = value.shots.map((shot) => ({ ...shot, review: 'draft' }));
    }
    latest.current = latest.current.map((p) => (p.id === value.id ? value : p));
    setProjects(latest.current);
    persist(value);
  };
  function add(project: StudioProject) {
    latest.current = [project, ...latest.current];
    setProjects(latest.current);
    setActiveId(project.id);
    persist(project);
  }

  return {
    projects,
    project,
    activeId,
    setActiveId,
    loading,
    error,
    saving,
    update,
    add,
    retry: () => {
      const failed = latest.current.filter((p) => failures.current.has(p.id));
      for (const item of failed.length ? failed : project ? [project] : []) persist(item);
    },
  };
}
export type StudioController = ReturnType<typeof useStudio>;
