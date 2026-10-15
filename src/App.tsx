import { useState } from 'react';
import { NexaPanel } from './features/nexabot/NexaPanel';
import { useNexabot } from './features/nexabot/useNexabot';
import './styles/nexabot.css';
import { StudioCanvas } from './features/canvas/StudioCanvas';
import { CopilotPanel } from './features/copilot/CopilotPanel';
import { DiagnosticsPanel } from './features/diagnostics/DiagnosticsPanel';
import { useDiagnostics } from './features/diagnostics/useDiagnostics';

export default function App() {
  const [tab, setTab] = useState<'connections' | 'copilot' | 'nexabot'>('nexabot');
  const diagnostics = useDiagnostics();
  const nexabot = useNexabot();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-symbol" aria-hidden="true">
            a
          </span>
          <div>
            <h1>
              aluraya<span>STUDIO</span>
            </h1>
            <p>Dari naskah menjadi adegan.</p>
          </div>
        </div>
        <div className="project-heading">
          <span className="project-dot" />
          <strong>Studio pertama</strong>
          <span className="badge not_run">Fondasi M-001</span>
        </div>
        <div className="header-state">
          <span className="status-dot" />
          Produksi belum aktif
        </div>
      </header>
      <main className="workspace">
        <aside className="journey" aria-label="Tahap produksi">
          <span className="eyebrow">ALUR PRODUKSI</span>
          <ol>
            <li className="current">
              <span>01</span>
              <div>
                Koneksi studio<small>Tahap saat ini</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                Naskah & aset<small>Menunggu M-001</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                Storyboard<small>Belum dimulai</small>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                Klip & review<small>Belum dimulai</small>
              </div>
            </li>
          </ol>
          <div className="journey-note">
            <strong>Ruang untuk cerita Anda.</strong>
            <p>Satu kartu awal untuk membuktikan alur gambar dan video.</p>
          </div>
        </aside>
        <StudioCanvas results={nexabot.state?.jobs ?? []} />
        <aside className="inspector" aria-label="Panel studio">
          <nav className="panel-tabs" aria-label="Pilihan panel">
            <button aria-pressed={tab === 'connections'} onClick={() => setTab('connections')}>
              Koneksi
            </button>
            <button aria-pressed={tab === 'copilot'} onClick={() => setTab('copilot')}>
              Copilot
            </button>
            <button aria-pressed={tab === 'nexabot'} onClick={() => setTab('nexabot')}>
              Nexabot
            </button>
          </nav>
          <div hidden={tab !== 'connections'}>
            <DiagnosticsPanel {...diagnostics} onRefresh={() => void diagnostics.refresh()} />
          </div>
          <div hidden={tab !== 'copilot'}>
            <CopilotPanel />
          </div>
          <div hidden={tab !== 'nexabot'}>
            <NexaPanel {...nexabot} />
          </div>
          <div className="production-footer">
            <span className="eyebrow">LANGKAH BERIKUTNYA</span>
            <p>Hubungkan Nexabot, periksa biaya, lalu setujui satu gambar atau video.</p>
            <button className="button primary" disabled aria-describedby="production-help">
              Mulai produksi
            </button>
            <small id="production-help">Produksi batch menunggu pembuktian integrasi.</small>
          </div>
        </aside>
      </main>
      <footer className="app-footer">
        <span>ALURAYA STUDIO · 0.1.0</span>
        <span>Data lokal · 1 job Nexabot aktif</span>
        <span>M-001 belum lulus</span>
      </footer>
    </div>
  );
}
