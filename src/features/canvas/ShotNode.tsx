import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { StudioShot } from '../../domain/studio';
export type ShotCanvasNode = Node<
  { shot: StudioShot; number: number; image: string | null; referenceCount: number },
  'shot'
>;
export function ShotNode({ data, selected }: NodeProps<ShotCanvasNode>) {
  const { shot, number, image, referenceCount } = data;
  return (
    <article className={`shot-card ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className="shot-card-header">
        <span>SHOT {String(number).padStart(2, '0')}</span>
        <span className={`badge ${shot.review === 'reviewed' ? 'pass' : 'not_run'}`}>
          {shot.review === 'reviewed' ? 'Rencana ditinjau' : 'Draf'}
        </span>
      </div>
      <div className="shot-visual">
        {image ? (
          <img src={image} alt="Referensi shot" />
        ) : (
          <>
            <span className="frame-corner top" />
            <span>{String(number).padStart(2, '0')}</span>
            <small>Ruang untuk adegan Anda</small>
            <span className="frame-corner bottom" />
          </>
        )}
        <span className="duration-tag">{shot.seconds}s · rencana</span>
      </div>
      <div className="shot-card-content">
        <small>{shot.scene}</small>
        <h3>{shot.title || 'Shot tanpa judul'}</h3>
        <p>{shot.action || 'Tambahkan aksi, kamera, dan dialog melalui panel detail.'}</p>
        <div>
          <span>{shot.camera || 'Kamera belum diisi'}</span>
          <span>{referenceCount} ref</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </article>
  );
}
