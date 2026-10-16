import { useEffect, useState } from 'react';
import { useProviderConfig } from './features/providers/useProviderConfig';
import { ProductionCanvas } from './features/canvas/ProductionCanvas';
import { useStudio } from './features/studio/useStudio';
import { ProjectDialog } from './features/studio/ProjectDialog';
import { StudioInspector, type InspectorTab } from './features/studio/StudioInspector';
import { Icon } from './features/studio/Icon';
import { newShot } from './domain/studio';

export default function App() {
  const studio = useStudio();
  const providers = useProviderConfig();
  const [focus, setFocus] = useState('');
  const [tab, setTab] = useState<InspectorTab>('copilot');
  const [selectedId, setSelectedId] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth > 1100);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    return () => {
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
    };
  }, []);
  const project = studio.project;
  if (!project)
    return (
      <main className="startup-state">
        <span className="brand-symbol">a</span>
        <h1>Aluraya Studio</h1>
        <p role="status">{studio.loading ? 'Membuka ruang cerita Anda…' : studio.error}</p>
        {!studio.loading && (
          <button className="button secondary" onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        )}
      </main>
    );
  function select(id: string) {
    setSelectedId(id);
    setTab(id === 'empty-shots' || id === 'empty-output' ? 'copilot' : 'detail');
    setPanelOpen(true);
  }
  function addShot() {
    if (!project) return;
    const shot = newShot(project.shots.length);
    studio.update({ ...project, shots: [...project.shots, shot] });
    select(shot.id);
  }
  function openProvider() {
    setTab('provider');
    setPanelOpen(true);
  }
  return (
    <div className="app-shell studio-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          aria-label="Buka proyek Aluraya"
          onClick={(e) => {
            e.preventDefault();
            setProjectsOpen(true);
          }}
        >
          <span className="brand-symbol" aria-hidden="true">
            a
          </span>
          <div>
            <h1>
              aluraya<span>STUDIO</span>
            </h1>
            <p>Dari naskah menjadi adegan.</p>
          </div>
        </a>
        <button className="project-switcher" onClick={() => setProjectsOpen(true)}>
          <Icon name="folder" />
          <span>{project.name}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div className="header-actions">
          <span className="save-state" role="status">
            <span className={`save-dot ${studio.error ? 'failed' : ''}`} />
            {studio.error ? 'Belum tersimpan' : studio.saving ? 'Menyimpan…' : 'Draf tersimpan'}
          </span>
          <button
            className="button secondary panel-toggle"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <Icon name="chat" size={16} />
            {panelOpen ? 'Tutup panel' : 'Buka panel'}
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-banner" role="status">
          Anda sedang offline. Naskah, aset, dan storyboard lokal tetap bisa disunting.
        </div>
      )}
      {studio.error && (
        <div className="save-error" role="alert">
          {studio.error}
          <button className="text-button" onClick={studio.retry}>
            Coba simpan lagi
          </button>
          <button className="text-button" onClick={() => setProjectsOpen(true)}>
            Cadangkan draf
          </button>
        </div>
      )}
      <nav className="canvas-navigation" aria-label="Navigasi canvas">
        <span className="eyebrow">CANVAS PRODUKSI</span>
        <button
          className="text-button"
          onClick={() => {
            select('script');
            setFocus(`script:${Date.now()}`);
          }}
        >
          Naskah
        </button>
        <button
          className="text-button"
          onClick={() => {
            select('empty-assets');
            setFocus(`lane-assets:${Date.now()}`);
          }}
        >
          Aset
        </button>
        <button className="text-button" onClick={() => setFocus(`lane-shots:${Date.now()}`)}>
          Storyboard
        </button>
        <button className="text-button" onClick={() => setFocus(`lane-output:${Date.now()}`)}>
          Hasil
        </button>
        <button className="text-button" onClick={openProvider}>
          Koneksi API
        </button>
      </nav>
      <main className={`workspace canvas-workspace ${panelOpen ? '' : 'panel-closed'}`}>
        <div className="studio-main" key={project.id}>
          <ProductionCanvas
            project={project}
            update={studio.update}
            selectedId={selectedId}
            select={select}
            focus={focus}
            addShot={addShot}
          />
        </div>
        <div className="inspector-container" hidden={!panelOpen}>
          <StudioInspector
            tab={tab}
            setTab={setTab}
            project={project}
            update={studio.update}
            selectedId={selectedId}
            select={select}
            providers={providers}
          />
        </div>
      </main>
      <footer className="app-footer">
        <span>ALURAYA STUDIO · 0.1.0</span>
        <span>
          {online ? 'Ruang kerja lokal' : 'Mode offline'} · {project.shots.length} shot
        </span>
        <span>Skema API tersedia · eksekutor belum tersambung</span>
      </footer>
      {projectsOpen && <ProjectDialog studio={studio} close={() => setProjectsOpen(false)} />}
    </div>
  );
}
