import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ProjectUpdate, StudioProject } from '../../domain/studio';
import { productionGraph, SHOT_TOP, type ProductionNode } from './productionGraph';
import { ShotNode } from './ShotNode';
import { WorkspaceNode } from './WorkspaceNode';
const nodeTypes = { shot: ShotNode, workspace: WorkspaceNode };
export function ProductionCanvas({
  project,
  update,
  selectedId,
  select,
  focus,
  addShot,
}: {
  project: StudioProject;
  update: ProjectUpdate;
  selectedId: string;
  select: (id: string) => void;
  focus: string;
  addShot: () => void;
}) {
  const graph = useMemo(() => productionGraph(project, selectedId), [project, selectedId]);
  const [nodes, setNodes] = useState(graph.nodes);
  const [list, setList] = useState(false);
  const [search, setSearch] = useState('');
  const flow = useRef<ReactFlowInstance<ProductionNode> | null>(null);
  useEffect(() => setNodes(graph.nodes), [graph]);
  useEffect(() => {
    if (focus)
      void flow.current?.fitView({
        nodes: [{ id: focus.split(':')[0]! }],
        padding: 0.45,
        maxZoom: 0.9,
        duration: 200,
      });
  }, [focus]);
  const matches = nodes.filter(
    (n) =>
      n.type === 'shot' &&
      `${n.data.shot.title} ${n.data.shot.scene}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="board-view" aria-label="Canvas produksi terpadu">
      <div className="board-heading">
        <div>
          <span className="eyebrow">STUDIO PRODUKSI</span>
          <h2>{project.name}</h2>
          <p>
            {project.ratio} · {project.assets.length} aset · {project.shots.length} shot
          </p>
        </div>
        <button className="button secondary" onClick={addShot}>
          + Shot manual
        </button>
      </div>
      <div className="board-toolbar">
        <button className="button secondary" aria-pressed={list} onClick={() => setList(!list)}>
          Daftar shot
        </button>
        <input
          aria-label="Cari shot"
          placeholder="Cari judul atau adegan…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setList(true);
          }}
        />
        <button
          className="button secondary"
          onClick={() => void flow.current?.fitView({ padding: 0.15, maxZoom: 0.8, duration: 200 })}
        >
          Lihat semua
        </button>
        <button
          className="button secondary"
          onClick={() =>
            update({
              ...project,
              shots: project.shots.map((s, i) => ({
                ...s,
                position: { x: (i % 3) * 350, y: Math.floor(i / 3) * 360 },
              })),
            })
          }
        >
          Rapikan
        </button>
      </div>
      {list && (
        <div className="canvas-shot-picker">
          {matches.map(
            (n) =>
              n.type === 'shot' && (
                <button
                  key={n.id}
                  onClick={() => {
                    select(n.id);
                    void flow.current?.fitView({
                      nodes: [{ id: n.id }],
                      padding: 0.4,
                      maxZoom: 1,
                      duration: 200,
                    });
                  }}
                >
                  {n.data.shot.scene} · {n.data.shot.title}
                </button>
              ),
          )}
          {!matches.length && <span>Belum ada shot yang cocok.</span>}
        </div>
      )}
      <div className="canvas-area">
        <ReactFlow<ProductionNode>
          nodes={nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flow.current = instance;
            void instance.fitView({
              nodes: [{ id: 'script' }, { id: 'empty-assets' }],
              padding: 0.3,
              maxZoom: 0.85,
            });
          }}
          onNodesChange={(changes) => setNodes((current) => applyNodeChanges(changes, current))}
          onNodeClick={(event, node) => {
            if (!event.shiftKey) select(node.id);
          }}
          onNodeDragStop={(_, __, dragged) =>
            update((current) => ({
              ...current,
              shots: current.shots.map((s) => {
                const node = dragged.find((n) => n.id === s.id);
                return node
                  ? {
                      ...s,
                      position: { x: node.position.x, y: Math.max(0, node.position.y - SHOT_TOP) },
                    }
                  : s;
              }),
            }))
          }
          minZoom={0.12}
          maxZoom={1.5}
          nodesConnectable={false}
          deleteKeyCode={null}
        >
          <Background gap={24} size={1} color="#c7d0bf" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor="#a5b796" />
        </ReactFlow>
      </div>
      <div className="board-status">
        <span>Aset di atas · storyboard di tengah · hasil di bawah</span>
        <span>Eksekusi API belum tersambung</span>
      </div>
    </section>
  );
}
