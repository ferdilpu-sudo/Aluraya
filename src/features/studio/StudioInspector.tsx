import type { ProjectUpdate, StudioProject } from '../../domain/studio';
import { ShotInspector } from './ShotInspector';
import { ScriptEditor } from './ScriptEditor';
import { AssetsView } from './AssetsView';
import { ProviderSettings } from '../providers/ProviderSettings';
import type { ProviderController } from '../providers/useProviderConfig';
import { PlanningCopilot } from '../copilot/PlanningCopilot';
export type InspectorTab = 'detail' | 'copilot' | 'provider';
export function StudioInspector({
  tab,
  setTab,
  project,
  update,
  selectedId,
  select,
  providers,
}: {
  tab: InspectorTab;
  setTab: (tab: InspectorTab) => void;
  project: StudioProject;
  update: ProjectUpdate;
  selectedId: string;
  select: (id: string) => void;
  providers: ProviderController;
}) {
  const shotId = selectedId.replace(/^output-/, '');
  return (
    <aside className="inspector" aria-label="Panel studio">
      <nav className="panel-tabs" aria-label="Pilihan panel">
        {(
          [
            ['copilot', 'Copilot'],
            ['detail', 'Detail'],
            ['provider', 'Koneksi API'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div hidden={tab !== 'copilot'}>
        <PlanningCopilot
          project={project}
          config={providers.config}
          configure={() => setTab('provider')}
        />
      </div>
      <div hidden={tab !== 'provider'}>
        <ProviderSettings {...providers} />
      </div>
      <div hidden={tab !== 'detail'}>
        {selectedId === 'script' ? (
          <ScriptEditor project={project} update={update} next={() => setTab('copilot')} />
        ) : selectedId === 'empty-assets' || project.assets.some((a) => a.id === selectedId) ? (
          <AssetsView
            key={selectedId}
            project={project}
            update={update}
            initialSelectedId={selectedId}
          />
        ) : (
          <ShotInspector
            key={shotId}
            project={project}
            shot={project.shots.find((s) => s.id === shotId)}
            update={update}
            select={select}
          />
        )}
      </div>
      <div className="inspector-foot">Persetujuan rencana dan biaya tetap terpisah</div>
    </aside>
  );
}
