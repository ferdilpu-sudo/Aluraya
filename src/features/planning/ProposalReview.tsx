import { useState } from 'react';
import type { ProposalEnvelope } from '../../contracts/proposal';
import { applyPlan, planIssues } from '../../domain/planning';
import { assetKinds, type ProjectUpdate, type StudioProject } from '../../domain/studio';
export function ProposalReview({
  project,
  proposal,
  update,
}: {
  project: StudioProject;
  proposal: ProposalEnvelope;
  update: ProjectUpdate;
}) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const issues = planIssues(project, proposal);
  const applied = project.planReceipts.some((r) => r.requestId === proposal.requestId);
  const content = proposal.content;
  const referenceName = (ref: string) =>
    ref.startsWith('new:')
      ? (content.assets.find((a) => `new:${a.key}` === ref)?.name ?? ref)
      : (project.assets.find((a) => `asset:${a.id}` === ref)?.name ?? ref);
  return (
    <section className="proposal-review form-stack" aria-label="Review usulan canvas">
      <h3>Review usulan canvas</h3>
      <p>{content.summary}</p>
      <small>
        Sumber: {proposal.source.sourceKind} · revisi {proposal.source.revision} ·{' '}
        {proposal.source.model}
      </small>
      {content.warnings.length > 0 && (
        <ul>
          {content.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <p>
        Tambahan: {content.assets.length} aset · {content.shots.length} shot · estimasi{' '}
        {content.shots.reduce((sum, s) => sum + s.seconds, 0)} detik. Target proyek{' '}
        {project.targetSeconds} detik. Data lama tetap tersedia.
      </p>
      {content.assets.map((a) => (
        <article className="connection-note" key={a.key}>
          <strong>
            {assetKinds[a.kind]} · {a.name}
          </strong>
          <p>{a.description || 'Tanpa deskripsi'}</p>
        </article>
      ))}
      {content.shots.map((s, i) => (
        <article className="connection-note" key={i}>
          <strong>
            {s.title} · {s.scene}
          </strong>
          <p>{s.action}</p>
          <p>Dialog: {s.dialogue || 'Tanpa dialog'}</p>
          <p>Suara: {s.sound || 'Belum ditentukan'}</p>
          <p>
            Kamera: {s.camera} · {s.seconds} detik
          </p>
          <p>Referensi: {s.references.map(referenceName).join(', ') || 'Tanpa referensi'}</p>
        </article>
      ))}
      {applied ? (
        <p role="status">
          Usulan sudah ditambahkan sebagai draf. Periksa status simpan proyek pada header.
        </p>
      ) : (
        <>
          {issues.length > 0 && (
            <ul className="error">
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
          <label className="llm-checkbox">
            <input
              type="checkbox"
              checked={checked}
              disabled={issues.length > 0}
              onChange={(e) => setChecked(e.target.checked)}
            />
            Saya sudah meninjau aset, dialog, referensi dan shot yang akan ditambahkan.
          </label>
          <button
            className="button primary"
            disabled={!checked || issues.length > 0}
            onClick={() => {
              try {
                update((current) => applyPlan(current, proposal));
                setError('');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Gagal menerapkan usulan.');
              }
            }}
          >
            Tambahkan sebagai draf
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <small>
        Ini persetujuan penambahan draf. Shot masih perlu direview; tidak ada gambar/video yang
        digenerasi. Usulan belum diterapkan hilang saat aplikasi ditutup.
      </small>
    </section>
  );
}
