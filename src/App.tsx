import { useEffect, useState } from 'react';
import { useNexabot } from './features/nexabot/useNexabot';
import { StudioCanvas } from './features/canvas/StudioCanvas';
import { useStudio } from './features/studio/useStudio';
import { ProjectDialog } from './features/studio/ProjectDialog';
import { ScriptEditor } from './features/studio/ScriptEditor';
import { AssetsView } from './features/studio/AssetsView';
import { ReviewView } from './features/studio/ReviewView';
import { StudioInspector, type InspectorTab } from './features/studio/StudioInspector';
import { Icon } from './features/studio/Icon';
import { newShot, stageNames, type Stage } from './domain/studio';

export default function App() {
  const studio = useStudio();
  const nexabot = useNexabot();
  const [stage, setStage] = useState<Stage>('script');
  const [tab, setTab] = useState<InspectorTab>('detail');
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
    setTab('detail');
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
  const counts = {
    script: project.script.trim() ? 'Terisi' : 'Mulai di sini',
    assets: `${project.assets.length} referensi`,
    board: `${project.shots.length} shot`,
    review: `${project.shots.filter((s) => s.review === 'reviewed').length} rencana ditinjau`,
  };
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
      <main className={`workspace studio-workspace ${panelOpen ? '' : 'panel-closed'}`}>
        <aside className="journey">
          <button className="all-projects" onClick={() => setProjectsOpen(true)}>
            <Icon name="folder" /> Semua proyek
          </button>
          <span className="eyebrow">ALUR PRODUKSI</span>
          <nav aria-label="Tahap produksi">
            {(Object.keys(stageNames) as Stage[]).map((id, index) => (
              <button
                className={stage === id ? 'active' : ''}
                aria-current={stage === id ? 'step' : undefined}
                aria-label={stageNames[id]}
                onClick={() => setStage(id)}
                key={id}
              >
                <Icon name={id} />
                <span>
                  <strong>{stageNames[id]}</strong>
                  <small>{counts[id]}</small>
                </span>
                <span className="stage-index">0{index + 1}</span>
              </button>
            ))}
          </nav>
          <div className="journey-summary">
            <span className="eyebrow">PROYEK INI</span>
            <dl>
              <div>
                <dt>Format</dt>
                <dd>{project.ratio}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{project.targetSeconds} detik</dd>
              </div>
              <div>
                <dt>Aset</dt>
                <dd>{project.assets.length}</dd>
              </div>
            </dl>
          </div>
          <div className="journey-note">
            <div className="mini-brand">a</div>
            <strong>
              Cerita yang baik
              <br />
              dimulai dari Anda.
            </strong>
            <p>
              Atur detailnya di sini.
              <br />
              Hidupkan bersama AI.
            </p>
          </div>
          <button className="connection-link" onClick={openProvider}>
            <Icon name="settings" /> Koneksi & pengaturan
            <span className="status-dot" />
          </button>
        </aside>
        <div className="studio-main" key={project.id}>
          {stage === 'script' && (
            <ScriptEditor
              project={project}
              update={studio.update}
              next={() => setStage('assets')}
            />
          )}
          {stage === 'assets' && <AssetsView project={project} update={studio.update} />}
          {stage === 'board' && (
            <StudioCanvas
              project={project}
              update={studio.update}
              selectedId={selectedId}
              select={select}
              add={addShot}
            />
          )}
          {stage === 'review' && (
            <ReviewView
              project={project}
              results={nexabot.state?.jobs ?? []}
              openProvider={openProvider}
            />
          )}
        </div>
        <div className="inspector-container" hidden={!panelOpen}>
          <StudioInspector
            tab={tab}
            setTab={setTab}
            project={project}
            update={studio.update}
            selectedId={selectedId}
            select={select}
            nexabot={nexabot}
          />
        </div>
      </main>
      <footer className="app-footer">
        <span>ALURAYA STUDIO · 0.1.0</span>
        <span>
          {online ? 'Ruang kerja lokal' : 'Mode offline'} · {project.shots.length} shot
        </span>
        <span>Produksi API belum disinkronkan</span>
      </footer>
      {projectsOpen && <ProjectDialog studio={studio} close={() => setProjectsOpen(false)} />}
    </div>
  );
}
