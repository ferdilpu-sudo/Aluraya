import type { NexaController } from './useNexabot';
import { nexaErrorMessage } from './errors';
const labels = {
  submitting: 'Mengirim',
  uncertain: 'Penerimaan belum pasti',
  queued: 'Dalam antrean',
  processing: 'Diproses',
  done: 'Selesai di provider; menunggu unduhan',
  ready: 'Tersimpan di canvas',
  failed: 'Gagal',
};
export function NexaJobs({ state, pending, execute }: NexaController) {
  if (!state) return null;
  return (
    <section className="nexa-section" aria-label="Riwayat generasi">
      <h3>Hasil & pemulihan</h3>
      <small>
        Menutup aplikasi tidak membatalkan job di Nexabot. Lanjutkan pemantauan setelah membuka
        kembali.
      </small>
      {state.activity === 'monitoring' && (
        <button className="button" onClick={() => void execute({ action: 'pause' })}>
          Jeda pemantauan
        </button>
      )}
      {state.jobs.length === 0 && <p>Belum ada request generasi.</p>}
      {state.jobs.map((job) => (
        <article className="nexa-job" key={job.id}>
          <strong>
            {job.input.mode === 'img' ? 'Gambar' : 'Video'} · {labels[job.state]}
          </strong>
          <p className="nexa-prompt">{job.input.prompt}</p>
          <small>
            {new Date(job.createdAt).toLocaleString('id-ID')} · biaya disetujui {job.cost} kredit
          </small>
          {job.chargedCost !== null && (
            <p>
              <small>
                Biaya dilaporkan Nexabot: {job.chargedCost} kredit
                {job.chargedCost !== job.cost
                  ? ' — berbeda dari biaya yang disetujui; periksa dengan Nexabot.'
                  : ''}
              </small>
            </p>
          )}
          {job.providerId && (
            <p>
              <small>
                Job: <code>{job.providerId}</code>
              </small>
            </p>
          )}
          {job.error && <p role="status">{nexaErrorMessage(job.error)}</p>}
          {job.providerId && ['queued', 'processing', 'done'].includes(job.state) && (
            <button
              className="button"
              disabled={pending || state.activity !== 'idle'}
              onClick={() => void execute({ action: 'resume', id: job.id })}
            >
              Lanjutkan pemantauan / unduhan
            </button>
          )}
        </article>
      ))}
      {state.jobCount > 3 && (
        <div className="nexa-actions">
          <button
            className="button"
            disabled={pending || state.page === 0}
            onClick={() => void execute({ action: 'history', page: state.page - 1 })}
          >
            Terbaru
          </button>
          <span>
            {state.page + 1} / {Math.ceil(state.jobCount / 3)}
          </span>
          <button
            className="button"
            disabled={pending || (state.page + 1) * 3 >= state.jobCount}
            onClick={() => void execute({ action: 'history', page: state.page + 1 })}
          >
            Sebelumnya
          </button>
        </div>
      )}
    </section>
  );
}
