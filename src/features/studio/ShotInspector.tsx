import type { ProjectUpdate } from '../../domain/studio';
import { useState } from 'react';
import {
  assetKinds,
  editShot,
  shotIssues,
  type StudioProject,
  type StudioShot,
} from '../../domain/studio';
import { Icon } from './Icon';
export function ShotInspector({
  project,
  shot,
  update,
  select,
}: {
  project: StudioProject;
  shot?: StudioShot;
  update: ProjectUpdate;
  select: (id: string) => void;
}) {
  const [tab, setTab] = useState<'details' | 'references'>('details');
  if (!shot)
    return (
      <div className="inspector-empty">
        <Icon name="board" size={32} />
        <h3>Detail adegan</h3>
        <p>Pilih sebuah shot di canvas atau daftar untuk menulis aksi, dialog, dan referensinya.</p>
      </div>
    );
  const index = project.shots.findIndex((s) => s.id === shot.id);
  const issues = shotIssues(shot);
  function change(patch: Partial<StudioShot>) {
    update({
      ...project,
      shots: project.shots.map((s) => (s.id === shot!.id ? editShot(s, patch) : s)),
    });
  }
  function move(direction: number) {
    const shots = [...project.shots];
    const other = index + direction;
    if (other < 0 || other >= shots.length) return;
    [shots[index], shots[other]] = [shots[other]!, shots[index]!];
    update({ ...project, shots });
  }
  return (
    <section className="shot-inspector form-stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SHOT {String(index + 1).padStart(2, '0')}</span>
          <h2>Detail adegan</h2>
        </div>
        <span className={`badge ${shot.review === 'reviewed' ? 'pass' : 'not_run'}`}>
          {shot.review === 'reviewed' ? 'Ditinjau' : 'Draf'}
        </span>
      </div>
      <div className="segmented">
        <button aria-pressed={tab === 'details'} onClick={() => setTab('details')}>
          Struktur
        </button>
        <button aria-pressed={tab === 'references'} onClick={() => setTab('references')}>
          Referensi ({shot.references.length})
        </button>
      </div>
      {tab === 'details' ? (
        <>
          <label>
            Judul shot
            <input
              value={shot.title}
              maxLength={120}
              onChange={(e) => change({ title: e.target.value })}
            />
          </label>
          <div className="field-row">
            <label>
              Adegan
              <input
                value={shot.scene}
                maxLength={80}
                onChange={(e) => change({ scene: e.target.value })}
              />
            </label>
            <label>
              Detik rencana
              <input
                type="number"
                min={1}
                max={600}
                value={shot.seconds}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n > 0 && n <= 600) change({ seconds: n });
                }}
              />
            </label>
          </div>
          <label>
            Aksi visual
            <textarea
              value={shot.action}
              maxLength={4000}
              rows={4}
              onChange={(e) => change({ action: e.target.value })}
              placeholder="Apa yang terjadi dalam frame ini?"
            />
          </label>
          <label>
            Framing & gerak kamera
            <input
              value={shot.camera}
              maxLength={160}
              onChange={(e) => change({ camera: e.target.value })}
              placeholder="Close-up · dolly in perlahan"
            />
          </label>
          <label>
            Dialog verbatim
            <textarea
              value={shot.dialogue}
              maxLength={4000}
              rows={3}
              onChange={(e) => change({ dialogue: e.target.value })}
              placeholder="NAMA TOKOH: Kalimat yang diucapkan…"
            />
          </label>
          <label>
            Ambience & efek suara
            <textarea
              value={shot.sound}
              maxLength={2000}
              rows={2}
              onChange={(e) => change({ sound: e.target.value })}
              placeholder="Angin, langkah kaki, pintu berderit…"
            />
          </label>
        </>
      ) : (
        <div className="reference-picker">
          <p className="context-note">Referensi untuk perencanaan. Belum diunggah ke provider.</p>
          {project.assets.map((asset) => (
            <label className="reference-option" key={asset.id}>
              <input
                type="checkbox"
                checked={shot.references.includes(asset.id)}
                onChange={(e) =>
                  change({
                    references: e.target.checked
                      ? [...shot.references, asset.id]
                      : shot.references.filter((id) => id !== asset.id),
                  })
                }
              />
              {asset.image ? <img src={asset.image} alt="" /> : <Icon name="assets" />}
              <span>
                <strong>{asset.name}</strong>
                <small>{assetKinds[asset.kind]}</small>
              </span>
            </label>
          ))}
          {!project.assets.length && (
            <p className="empty-note">
              Tambahkan karakter, lokasi, atau properti di tab Aset terlebih dahulu.
            </p>
          )}
        </div>
      )}
      <div className="shot-check">
        <strong>Pemeriksaan rencana</strong>
        {issues.length ? (
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p>Aksi dan kamera sudah diisi. Tinjau dialog dan kontinuitas sebelum produksi.</p>
        )}
        <button
          className="button secondary"
          disabled={issues.length > 0}
          onClick={() => change({ review: shot.review === 'reviewed' ? 'draft' : 'reviewed' })}
        >
          {shot.review === 'reviewed' ? 'Kembalikan ke draf' : 'Tandai rencana ditinjau'}
        </button>
        <small>Peninjauan ini tidak menyetujui biaya atau mengirim generasi.</small>
      </div>
      <div className="nexa-actions">
        <button className="button secondary" disabled={index === 0} onClick={() => move(-1)}>
          ↑ Urutan
        </button>
        <button
          className="button secondary"
          disabled={index === project.shots.length - 1}
          onClick={() => move(1)}
        >
          ↓ Urutan
        </button>
        <button
          className="text-button"
          onClick={() => {
            const copy = {
              ...shot,
              id: crypto.randomUUID(),
              title: `${shot.title.slice(0, 110)} (salinan)`,
              review: 'draft' as const,
              position: { x: shot.position.x + 40, y: shot.position.y + 40 },
            };
            update({ ...project, shots: [...project.shots, copy] });
            select(copy.id);
          }}
        >
          Duplikat
        </button>
      </div>
      <button
        className="text-button danger"
        onClick={() => {
          if (window.confirm('Hapus shot ini dari draf? Hasil provider tidak dihapus.')) {
            update({ ...project, shots: project.shots.filter((s) => s.id !== shot.id) });
            select('');
          }
        }}
      >
        Hapus shot
      </button>
    </section>
  );
}
