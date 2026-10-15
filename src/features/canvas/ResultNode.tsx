import type { Node, NodeProps } from '@xyflow/react';
import type { NexaView } from '../../application/nexabot';
import { useState } from 'react';

export type ResultCanvasNode = Node<
  { selectedForReview: boolean; job?: NexaView['jobs'][number] },
  'result'
>;

export function ResultNode({ selected, data }: NodeProps<ResultCanvasNode>) {
  const job = data.job;
  const [failed, setFailed] = useState(false);
  return (
    <article
      className={`result-card ${selected ? 'selected' : ''}`}
      aria-label={job ? 'Hasil Nexabot tersimpan' : 'Belum ada media'}
    >
      <div className="card-top">
        <span className="eyebrow">HASIL NEXABOT</span>
        <span className="badge not_run">{job ? 'Tersimpan' : 'Belum ada media'}</span>
      </div>
      {job?.previewUrl ? (
        <div className="result-preview nodrag nopan">
          {job.input.mode === 'img' ? (
            <img src={job.previewUrl} alt={job.input.prompt} onError={() => setFailed(true)} />
          ) : (
            <video
              src={job.previewUrl}
              controls
              preload="none"
              onPlay={(event) => {
                document.querySelectorAll('video').forEach((video) => {
                  if (video !== event.currentTarget) video.pause();
                });
              }}
              onError={() => setFailed(true)}
            />
          )}
          {failed && <p role="alert">Preview tidak dapat dibuka. Berkas hasil tetap tersimpan.</p>}
          <p>{job.input.prompt}</p>
          <small>
            {job.media?.bytes.toLocaleString('id-ID')} byte ·{' '}
            {job.input.mode === 'img' ? 'JPG' : 'MP4'}
          </small>
        </div>
      ) : (
        <div className="media-placeholder">
          <span className="frame-mark" aria-hidden="true">
            ▷
          </span>
          <strong>Tempat adegan Anda dimulai</strong>
          <p>
            Hasil gambar atau video akan muncul di sini
            <br />
            setelah generasi Nexabot selesai.
          </p>
        </div>
      )}
      <div className="card-bottom">
        <span>Media tersimpan lokal</span>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}
