import { useEffect, useRef, useState } from 'react';
import { newProject } from '../../domain/studio';
import { downloadDraft, importDraft } from '../../infrastructure/studioStorage';
import type { StudioController } from './useStudio';
import { Icon } from './Icon';

export function ProjectDialog({ studio, close }: { studio: StudioController; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      onCancel={close}
      aria-labelledby="projects-title"
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">RUANG CERITA</span>
          <h2 id="projects-title">Proyek Anda</h2>
        </div>
        <button className="icon-button" aria-label="Tutup proyek" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            studio.add(newProject(name.trim()));
            close();
          }
        }}
      >
        <label htmlFor="new-project">Buat cerita baru</label>
        <div className="inline-form">
          <input
            id="new-project"
            placeholder="Judul proyek"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <button className="button primary" disabled={!name.trim()}>
            Buat proyek
          </button>
        </div>
      </form>
      <div className="project-list">
        {studio.projects.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              studio.setActiveId(p.id);
              close();
            }}
          >
            <Icon name="folder" />
            <span>
              <strong>{p.name}</strong>
              <small>
                {p.shots.length} shot · {p.ratio} ·{' '}
                {new Date(p.updatedAt).toLocaleDateString('id-ID')}
              </small>
            </span>
            <span className="badge not_run">{p.id === studio.activeId ? 'Aktif' : 'Buka'}</span>
          </button>
        ))}
      </div>
      <div className="dialog-actions">
        <label className="button secondary file-button">
          {busy ? 'Membaca…' : 'Impor cadangan'}
          <input
            type="file"
            accept=".json"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                studio.add(await importDraft(file));
                close();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Cadangan tidak valid.');
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <button
          className="button secondary"
          disabled={!studio.project}
          onClick={() => {
            if (studio.project) downloadDraft(studio.project);
          }}
        >
          Ekspor draf aktif
        </button>
      </div>
      <p className="muted">
        Draf dan referensi tersimpan di perangkat ini. Cadangan JSON tidak menyertakan API key, sesi
        ChatGPT, atau hasil Nexabot.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </dialog>
  );
}
