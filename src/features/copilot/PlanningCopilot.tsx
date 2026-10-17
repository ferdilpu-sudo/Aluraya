import { useState } from 'react';
import type { ProjectUpdate, StudioProject } from '../../domain/studio';
import type { ProviderConfig } from '../../contracts/providers';
import { ApiCopilot } from '../llm/ApiCopilot';
import { CopilotPanel } from './CopilotPanel';
export function PlanningCopilot({
  project,
  update,
  config,
  configure,
}: {
  project: StudioProject;
  update: ProjectUpdate;
  config: ProviderConfig;
  configure: () => void;
}) {
  const [legacy, setLegacy] = useState(false);
  const profile = config.profiles.find((p) => p.id === config.routing.llm);
  return (
    <section className="planning-copilot">
      <span className="eyebrow">PARTNER PRODUKSI</span>
      <h2>Bangun cerita bersama AI.</h2>
      <p>
        Mulai dari ide atau naskah. Copilot akan mengusulkan aset dan shot untuk ditinjau pada
        canvas.
      </p>
      <div className="connection-note">
        <strong>Konteks proyek</strong>
        <p>
          {project.name} · {project.script.trim() ? 'Naskah tersedia' : 'Naskah belum diisi'} ·{' '}
          {project.assets.length} aset · {project.shots.length} shot
        </p>
        <small>Konteks proyek tidak dikirim otomatis; pilih teks melalui Copilot API.</small>
      </div>
      <ol className="copilot-workflow">
        <li>Susun usulan cerita dan aset</li>
        <li>Tinjau storyboard dan kontinuitas</li>
        <li>Setujui input serta biaya produksi</li>
        <li>Review hasil pada shot terkait</li>
      </ol>
      <div className="connection-note">
        <strong>{profile ? `${profile.name} · ${profile.model}` : 'Pilih API LLM Anda'}</strong>
        <p>
          {profile
            ? 'Profil dipilih. Chat Completions dapat dipakai melalui Copilot API di bawah; siapkan usulan, lalu tinjau sebelum menambahkan ke canvas.'
            : 'Provider, endpoint dan model dapat disesuaikan melalui Koneksi API.'}
        </p>
        <button className="button secondary" onClick={configure}>
          Atur koneksi API
        </button>
      </div>
      <ApiCopilot profile={profile} project={project} update={update} />
      <details onToggle={(e) => setLegacy(e.currentTarget.open)}>
        <summary>ChatGPT akun · opsi terpisah</summary>
        {legacy && <CopilotPanel />}
      </details>
    </section>
  );
}
