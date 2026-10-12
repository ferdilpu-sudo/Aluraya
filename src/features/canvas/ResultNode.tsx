import type { Node, NodeProps } from '@xyflow/react';

export type ResultCanvasNode = Node<{ selectedForReview: boolean }, 'result'>;

export function ResultNode({ selected }: NodeProps<ResultCanvasNode>) {
  return (
    <article
      className={`result-card ${selected ? 'selected' : ''}`}
      aria-label="Kartu hasil Flow: belum ada media"
    >
      <div className="card-top">
        <span className="eyebrow">HASIL PERTAMA</span>
        <span className="badge not_run">Belum ada media</span>
      </div>
      <div className="media-placeholder">
        <span className="frame-mark" aria-hidden="true">
          ▷
        </span>
        <strong>Tempat adegan Anda dimulai</strong>
        <p>
          Hasil gambar atau video akan muncul di sini
          <br />
          setelah integrasi Flow siap.
        </p>
      </div>
      <div className="card-bottom">
        <span>01 / Pembuktian integrasi</span>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}
