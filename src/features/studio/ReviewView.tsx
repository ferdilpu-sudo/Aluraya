import type { NexaView } from '../../application/nexabot';
import { MediaCanvas } from '../canvas/MediaCanvas';
import type { StudioProject } from '../../domain/studio';
import { downloadDraft } from '../../infrastructure/studioStorage';
import { Icon } from './Icon';
export function ReviewView({
  project,
  results,
  openProvider,
}: {
  project: StudioProject;
  results: NexaView['jobs'];
  openProvider: () => void;
}) {
  const reviewed = project.shots.filter((s) => s.review === 'reviewed').length;
  const ready = results.filter((job) => job.media && job.previewUrl);
  return (
    <section className="scroll-view review-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">04 / TINJAU & LANJUTKAN</span>
          <h2>Ruang untuk hasil terbaik.</h2>
          <p>Periksa rencana, lalu tinjau media setelah backend tersinkron.</p>
        </div>
        <span className="page-number" aria-hidden="true">
          04
        </span>
      </div>
      <div className="review-metrics">
        <div>
          <span>Rencana ditinjau</span>
          <strong>
            {reviewed}
            <small> / {project.shots.length} shot</small>
          </strong>
        </div>
        <div>
          <span>Durasi rencana</span>
          <strong>
            {project.shots.reduce((sum, s) => sum + s.seconds, 0)}
            <small> detik</small>
          </strong>
        </div>
        <div>
          <span>Format proyek</span>
          <strong>{project.ratio}</strong>
        </div>
      </div>
      <div className="review-banner">
        <Icon name="review" size={28} />
        <div>
          <strong>Siapkan cerita. Sambungkan produksi berikutnya.</strong>
          <p>
            Hubungan shot → job dan ekspor klip akan diaktifkan saat sinkronisasi backend. Draf
            tetap bisa disunting dan dicadangkan.
          </p>
        </div>
        <button className="button secondary" onClick={openProvider}>
          Buka Nexabot
        </button>
      </div>
      <div className="section-heading">
        <h3>Hasil Nexabot</h3>
        <span className="badge not_run">Riwayat akun · belum terikat proyek</span>
      </div>
      <p className="context-note">
        Menampilkan halaman riwayat yang sedang dibuka pada panel Nexabot.
      </p>
      {ready.length ? (
        <MediaCanvas results={results} />
      ) : (
        <div className="review-empty">
          <Icon name="review" size={34} />
          <h3>Belum ada hasil untuk ditinjau</h3>
          <p>
            Media yang berhasil diambil Nexabot akan tampil di sini.
            <br />
            Tidak ada generasi atau biaya yang dijalankan dari draf.
          </p>
        </div>
      )}
      <div className="export-card">
        <div>
          <h3>Cadangan proyek</h3>
          <p>
            Simpan naskah, aset referensi, dan urutan shot sebagai JSON. Media hasil provider
            terpisah.
          </p>
        </div>
        <button className="button primary" onClick={() => downloadDraft(project)}>
          <Icon name="export" size={16} /> Ekspor draf
        </button>
      </div>
    </section>
  );
}
