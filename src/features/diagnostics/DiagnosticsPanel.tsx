import type { Diagnostics } from '../../contracts/diagnostics';

const labels = { pass: 'Terhubung', blocked: 'Belum siap', not_run: 'Belum diperiksa' };
interface Props {
  report: Diagnostics | null;
  busy: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DiagnosticsPanel({ report, busy, error, onRefresh }: Props) {
  return (
    <section className="diagnostics" aria-labelledby="diagnostics-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KONEKSI STUDIO</span>
          <h2 id="diagnostics-title">Kesiapan aplikasi</h2>
        </div>
        <button className="button secondary" onClick={onRefresh} disabled={busy}>
          {busy ? 'Memeriksa…' : 'Periksa sekarang'}
        </button>
      </div>
      <p className="muted">Pemeriksaan lokal tidak menjalankan generasi atau menggunakan kredit.</p>
      <div aria-live="polite" aria-busy={busy}>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {!report && !error && <p className="empty-note">Periksa host dan sidecar untuk memulai.</p>}
        {report && (
          <>
            <ul className="check-list">
              {report.checks.map((check) => (
                <li key={check.id}>
                  <div>
                    <strong>{check.label}</strong>
                    <span className={`badge ${check.state}`}>{labels[check.state]}</span>
                  </div>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
            <p className="runtime-note">
              {report.runtime === 'browser' ? 'Pratinjau browser' : 'Host desktop'} ·{' '}
              {report.platform}
              {report.nodeVersion && ` · Node ${report.nodeVersion}`}
              <br />
              Diperiksa {new Date(report.checkedAt).toLocaleTimeString('id-ID')}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
