import { useState } from 'react';
import type { LlmConnection, LlmSnapshot } from '../../contracts/llm';
import type { PlanSource } from '../../contracts/proposal';
import type { StudioProject } from '../../domain/studio';
import { createPlanSource } from '../../domain/planning';
import { readPlanReply, type PlanBinding } from '../../domain/planReply';
export function usePlanWorkflow(
  project: StudioProject,
  connection: LlmConnection | null,
  reply: LlmSnapshot['reply'],
) {
  const [draft, setDraft] = useState<PlanSource | null>(null);
  const [binding, setBinding] = useState<PlanBinding | null>(null);
  const [error, setError] = useState('');
  const stale = Boolean(
    draft &&
    (draft.projectId !== project.id ||
      draft.revision !== project.revision ||
      draft.providerId !== connection?.id ||
      draft.model !== connection.model),
  );
  return {
    stale,
    error,
    ...readPlanReply(binding, reply),
    build(text: string, kind: PlanSource['sourceKind']): PlanSource | null {
      try {
        if (!connection) throw new Error('Pilih profil Chat Completions terlebih dahulu.');
        const source = createPlanSource(project, text, kind, connection.id, connection.model);
        setDraft(source);
        setError('');
        return source;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal menyusun pesan.');
        return null;
      }
    },
    edit() {
      setDraft(null);
      setError('');
    },
    bind(requestId: string, text: string): boolean {
      if (draft && (stale || text.trim() !== draft.prompt)) {
        setError('Konteks usulan berubah. Siapkan ulang pesan dari proyek saat ini.');
        return false;
      }
      setBinding(draft ? { requestId, source: draft } : null);
      setError('');
      return true;
    },
  };
}
