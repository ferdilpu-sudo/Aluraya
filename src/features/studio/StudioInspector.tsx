import type { ProjectUpdate } from '../../domain/studio';
import { useState } from 'react';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { NexaPanel } from '../nexabot/NexaPanel';
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
import { useDiagnostics } from '../diagnostics/useDiagnostics';
import type { NexaController } from '../nexabot/useNexabot';
import { ShotInspector } from './ShotInspector';
import type { StudioProject } from '../../domain/studio';
export type InspectorTab = 'detail' | 'copilot' | 'provider';
export function StudioInspector({
  tab,
  setTab,
  project,
  update,
  selectedId,
  select,
  nexabot,
}: {
  tab: InspectorTab;
  setTab: (tab: InspectorTab) => void;
  project: StudioProject;
  update: ProjectUpdate;
  selectedId: string;
  select: (id: string) => void;
  nexabot: NexaController;
}) {
  const diagnostics = useDiagnostics();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  return (
    <aside className="inspector" aria-label="Panel studio">
      <nav className="panel-tabs" aria-label="Pilihan panel">
        {(
          [
            ['detail', 'Detail'],
            ['copilot', 'Copilot'],
            ['provider', 'Nexabot'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div hidden={tab !== 'detail'}>
        <ShotInspector
          key={selectedId}
          project={project}
          shot={project.shots.find((s) => s.id === selectedId)}
          update={update}
          select={select}
        />
      </div>
      <div hidden={tab !== 'copilot'}>
        <CopilotPanel />
      </div>
      <div hidden={tab !== 'provider'}>
        <div className="connection-context">
          <span className="eyebrow">KONEKSI PRODUKSI</span>
          <h2>Nexabot</h2>
          <p>
            Draf studio belum terhubung ke job API. Form generasi di bawah bekerja sebagai
            permintaan terpisah dengan persetujuan biaya sendiri.
          </p>
        </div>
        <NexaPanel {...nexabot} />
        <div className="diagnostic-toggle">
          <button
            className="text-button"
            aria-expanded={showDiagnostics}
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            Diagnostik aplikasi {showDiagnostics ? '−' : '+'}
          </button>
        </div>
        {showDiagnostics && (
          <DiagnosticsPanel {...diagnostics} onRefresh={() => void diagnostics.refresh()} />
        )}
      </div>
      <div className="inspector-foot">
        <span className="status-dot" />
        {tab === 'copilot'
          ? 'ChatGPT menggunakan paket akun Anda'
          : 'Draf lokal · sinkronisasi produksi berikutnya'}
      </div>
    </aside>
  );
}
