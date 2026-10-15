import { useEffect, useState } from 'react';
import { Background, Controls, ReactFlow, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NexaView } from '../../application/nexabot';
import { ResultNode, type ResultCanvasNode } from './ResultNode';
const nodeTypes = { result: ResultNode };
export function MediaCanvas({ results }: { results: NexaView['jobs'] }) {
  const [nodes, setNodes] = useState<ResultCanvasNode[]>([]);
  useEffect(() => {
    setNodes((current) =>
      results
        .filter((job) => job.media && job.previewUrl)
        .map((job, index) => {
          const existing = current.find((node) => node.id === job.id);
          return {
            id: job.id,
            type: 'result',
            position: existing?.position ?? { x: index * 410, y: 0 },
            selected: existing?.selected ?? false,
            data: { selectedForReview: false, job },
          };
        }),
    );
  }, [results]);
  return (
    <div className="media-canvas" aria-label="Canvas hasil Nexabot">
      <ReactFlow<ResultCanvasNode>
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => setNodes((current) => applyNodeChanges(changes, current))}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 0.85 }}
        minZoom={0.25}
        maxZoom={1.5}
        nodesConnectable={false}
        deleteKeyCode={null}
      >
        <Background gap={24} size={1} color="#c7d0bf" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
