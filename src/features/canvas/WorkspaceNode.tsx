import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
export type WorkspaceCanvasNode = Node<
  {
    kind: 'script' | 'asset' | 'lane' | 'output' | 'empty';
    title: string;
    description: string;
    image?: string | null;
    label: string;
  },
  'workspace'
>;
export function WorkspaceNode({ data, selected }: NodeProps<WorkspaceCanvasNode>) {
  if (data.kind === 'lane')
    return (
      <div className="canvas-lane">
        <span className="eyebrow">{data.label}</span>
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
    );
  return (
    <article className={`workspace-card ${data.kind} ${selected ? 'selected' : ''}`}>
      {data.kind === 'output' && (
        <Handle type="target" position={Position.Top} isConnectable={false} />
      )}
      <span className="eyebrow">{data.label}</span>
      {data.image && <img src={data.image} alt={data.title} />}
      <h3>{data.title}</h3>
      <p>{data.description}</p>
      {data.kind === 'output' && <span className="badge not_run">Belum diproduksi</span>}
      {['asset', 'script'].includes(data.kind) && (
        <Handle type="source" position={Position.Bottom} isConnectable={false} />
      )}
    </article>
  );
}
