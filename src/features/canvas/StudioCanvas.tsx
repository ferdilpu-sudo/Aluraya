import { Background, Controls, ReactFlow, useNodesState } from '@xyflow/react';
import { ResultNode, type ResultCanvasNode } from './ResultNode';
import '@xyflow/react/dist/style.css';
import type { NexaView } from '../../application/nexabot';

const nodeTypes = { result: ResultNode };
const initialNodes: ResultCanvasNode[] = [
  {
    id: 'integration-result',
    type: 'result',
    position: { x: 0, y: 0 },
    data: { selectedForReview: false },
  },
];

export function StudioCanvas({ results }: { results: NexaView['jobs'] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const ready = results.filter((job) => job.media && job.previewUrl);
  const displayed: ResultCanvasNode[] = ready.length
    ? ready.map((job, index) => ({
        id: job.id,
        type: 'result',
        position: { x: index * 410, y: 0 },
        data: { selectedForReview: false, job },
      }))
    : nodes;
  function selectResult() {
    setNodes((current) => current.map((node) => ({ ...node, selected: true })));
  }
  return (
    <section className="canvas-area" aria-label="Canvas produksi">
      <div className="canvas-caption">
        <span className="eyebrow">WORKSPACE</span>
        <h2>Satu adegan, langkah pertama.</h2>
        <p>Mulai dengan memastikan koneksi studio Anda.</p>
      </div>
      <ReactFlow
        nodes={displayed}
        nodeTypes={nodeTypes}
        onNodesChange={ready.length ? undefined : onNodesChange}
        nodesDraggable={!ready.length}
        fitView
        fitViewOptions={{ padding: 0.45, maxZoom: 1 }}
        minZoom={0.35}
        maxZoom={1.5}
        nodesConnectable={false}
        deleteKeyCode={null}
        aria-label="Canvas hasil integrasi"
      >
        <Background gap={24} size={1} color="#cdd3c8" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="canvas-footer">
        <button className="text-button" onClick={selectResult}>
          Pilih kartu hasil
        </button>
        <span>Hasil tersimpan lokal · tampilan mengikuti halaman riwayat</span>
      </div>
    </section>
  );
}
