import type { ProjectUpdate } from '../../domain/studio';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ShotNode, type ShotCanvasNode } from './ShotNode';
import type { StudioProject } from '../../domain/studio';
import { Icon } from '../studio/Icon';
const nodeTypes = { shot: ShotNode };
export function StudioCanvas({
  project,
  update,
  selectedId,
  select,
  add,
}: {
  project: StudioProject;
  update: ProjectUpdate;
  selectedId: string;
  select: (id: string) => void;
  add: () => void;
}) {
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [query, setQuery] = useState('');
  const flow = useRef<ReactFlowInstance<ShotCanvasNode> | null>(null);
  const source = useMemo(
    () =>
      project.shots.map((shot, index): ShotCanvasNode => ({
        id: shot.id,
        type: 'shot',
        position: shot.position,
        selected: shot.id === selectedId,
        data: {
          shot,
          number: index + 1,
          image:
            project.assets.find((a) => shot.references.includes(a.id) && a.image)?.image ?? null,
          referenceCount: shot.references.length,
        },
        hidden: !`${shot.title} ${shot.scene} ${shot.action}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      })),
    [project.shots, project.assets, selectedId, query],
  );
  const [nodes, setNodes] = useState(source);
  useEffect(() => setNodes(source), [source]);
  const edges: Edge[] = project.shots.slice(1).map((shot, index) => ({
    id: `sequence-${shot.id}`,
    source: project.shots[index]!.id,
    target: shot.id,
    label: 'urutan',
    type: 'smoothstep',
    style: { stroke: '#a3b29b' },
    labelStyle: { fill: '#64715e', fontSize: 10 },
    hidden: Boolean(source.find((n) => n.id === shot.id)?.hidden || source[index]?.hidden),
  }));
  const seconds = project.shots.reduce((sum, s) => sum + s.seconds, 0);
  function arrange() {
    update({
      ...project,
      shots: project.shots.map((s, i) => ({
        ...s,
        position: { x: (i % 3) * 350, y: Math.floor(i / 3) * 360 },
      })),
    });
    window.requestAnimationFrame(
      () => void flow.current?.fitView({ padding: 0.2, maxZoom: 1, duration: 250 }),
    );
  }
  function focus(id: string) {
    select(id);
    void flow.current?.fitView({ nodes: [{ id }], padding: 0.6, maxZoom: 1, duration: 250 });
  }
  return (
    <section className="board-view" aria-label="Storyboard produksi">
      <div className="board-heading">
        <div>
          <span className="eyebrow">03 / SUSUN ADEGAN</span>
          <h2>Storyboard</h2>
          <p>
            {project.shots.length} shot · {seconds} detik rencana / {project.targetSeconds} detik
            target
          </p>
        </div>
        <button className="button primary" onClick={add}>
          <Icon name="plus" size={15} /> Tambah shot
        </button>
      </div>
      <div className="board-toolbar">
        <div className="segmented">
          <button aria-pressed={view === 'canvas'} onClick={() => setView('canvas')}>
            Canvas
          </button>
          <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
            Daftar shot
          </button>
        </div>
        <input
          aria-label="Cari shot"
          placeholder="Cari shot atau adegan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="button secondary" onClick={arrange} disabled={!project.shots.length}>
          Rapikan
        </button>
      </div>
      {view === 'canvas' ? (
        <div className="canvas-area">
          <ReactFlow<ShotCanvasNode>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={(instance) => {
              flow.current = instance;
            }}
            onNodesChange={(changes) => setNodes((current) => applyNodeChanges(changes, current))}
            onNodeClick={(event, node) => {
              if (!event.shiftKey) select(node.id);
            }}
            onNodeDragStop={(_, __, dragged) =>
              update({
                ...project,
                shots: project.shots.map((shot) => ({
                  ...shot,
                  position: dragged.find((n) => n.id === shot.id)?.position ?? shot.position,
                })),
              })
            }
            fitView
            fitViewOptions={{ padding: 0.25, maxZoom: 0.9 }}
            minZoom={0.2}
            maxZoom={1.6}
            nodesConnectable={false}
            deleteKeyCode={null}
            aria-label="Canvas shot"
          >
            <Background gap={24} size={1} color="#c6cfbf" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#a9b99e" maskColor="#f1f3edb0" />
          </ReactFlow>
          {!project.shots.length && (
            <div className="board-empty">
              <div className="empty-board-art">
                <Icon name="board" size={46} />
              </div>
              <span className="eyebrow">CERITA ANDA, FRAME DEMI FRAME</span>
              <h3>Beri cerita Anda ruang.</h3>
              <p>
                Mulai dari satu shot. Susun aksi, kamera, dialog,
                <br />
                dan referensinya sebelum masuk produksi.
              </p>
              <button className="button primary" onClick={add}>
                + Buat shot pertama
              </button>
            </div>
          )}
          {project.shots.length > 0 && !source.some((n) => !n.hidden) && (
            <div className="search-empty">
              Tidak ada shot yang cocok.
              <button className="text-button" onClick={() => setQuery('')}>
                Hapus pencarian
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="shot-list scroll-view">
          {source
            .filter((n) => !n.hidden)
            .map((n) => (
              <button
                className={n.id === selectedId ? 'active' : ''}
                key={n.id}
                onClick={() => focus(n.id)}
              >
                <span className="shot-index">{String(n.data.number).padStart(2, '0')}</span>
                <div>
                  <small>{n.data.shot.scene}</small>
                  <strong>{n.data.shot.title}</strong>
                  <p>{n.data.shot.action || 'Deskripsi belum diisi'}</p>
                </div>
                <span>{n.data.shot.seconds}s</span>
                <span className="badge not_run">
                  {n.data.shot.review === 'reviewed' ? 'Ditinjau' : 'Draf'}
                </span>
              </button>
            ))}
          {!source.some((n) => !n.hidden) && (
            <p className="empty-note">
              Belum ada shot yang ditampilkan. Tambah shot atau ubah pencarian.
            </p>
          )}
        </div>
      )}
      <div className="board-status">
        <span>{project.ratio} · Durasi adalah rencana, bukan durasi keluaran API.</span>
        <span>Shift + klik untuk pilih banyak</span>
      </div>
    </section>
  );
}
