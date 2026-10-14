import { useFlow } from './useFlow';
import { flowError } from './flowErrors';

const pageNames = {
  flow: 'Alamat Flow terbuka',
  login: 'Halaman login Google',
  login_rejected: 'Login ditolak Google',
  other: 'Halaman belum dikenali',
  closed: 'Tidak ada halaman',
};
export function FlowPanel() {
  const { state, error, pending, execute } = useFlow();
  const busy = pending || !state;
  const rejected = state?.observation?.page === 'login_rejected';
  return (
    <section className="copilot" aria-labelledby="flow-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KONEKSI GAMBAR & VIDEO</span>
          <h2 id="flow-title">Google Flow</h2>
        </div>
      </div>
      <div className="connection-note">
        <strong>Browser Flow milik Aluraya · WebView2</strong>
        <p>
          Login sendiri di jendela Flow. Sesi tersimpan pada profil khusus Aluraya. Satu profil
          aktif pada satu waktu.
        </p>
        <p>
          Profil Chrome/Edge dari versi sebelumnya tetap tersimpan terpisah. Buat profil WebView2
          baru untuk pemeriksaan ini.
        </p>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {state?.error && (
        <p className="error" role="alert">
          {flowError(state.error)}
        </p>
      )}
      {!state && (
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => void execute({ action: 'inspect' })}
        >
          Periksa koneksi desktop
        </button>
      )}
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void execute({ action: 'create' })}
      >
        Tambah profil Flow
      </button>
      {state && (
        <>
          <ul className="check-list">
            {state.profiles.map((profile, index) => (
              <li key={profile.id}>
                <div>
                  <strong>Profil {state.profilePage * 10 + index + 1} · WebView2</strong>
                  <button
                    className="text-button"
                    disabled={busy || state.browserOpen}
                    onClick={() => void execute({ action: 'open', profileId: profile.id })}
                  >
                    {state.activeProfileId === profile.id ? 'Aktif' : 'Buka'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!state.profileCount && (
            <p className="empty-note">Tambahkan profil untuk memeriksa akses Flow.</p>
          )}
          {state.profileCount > 10 && (
            <div className="chat-actions">
              <button
                disabled={busy || state.profilePage === 0}
                onClick={() => void execute({ action: 'profiles', page: state.profilePage - 1 })}
              >
                Sebelumnya
              </button>
              <span>Halaman {state.profilePage + 1}</span>
              <button
                disabled={busy || (state.profilePage + 1) * 10 >= state.profileCount}
                onClick={() => void execute({ action: 'profiles', page: state.profilePage + 1 })}
              >
                Berikutnya
              </button>
            </div>
          )}
          <p className="runtime-note" role="status">
            {pending
              ? 'Sedang memproses…'
              : rejected
                ? 'Koneksi terhenti: Google menolak login.'
                : state.browserOpen
                  ? 'Browser terbuka. Login dan buka proyek Flow.'
                  : 'Browser belum terbuka.'}
          </p>
          <div className="chat-actions">
            <button
              className="button secondary"
              disabled={busy || !state.browserOpen}
              onClick={() => void execute({ action: 'observe' })}
            >
              Periksa halaman Flow
            </button>
            <button
              className="text-button"
              disabled={busy || !state.browserOpen}
              onClick={() => void execute({ action: 'close' })}
            >
              Tutup browser Flow
            </button>
          </div>
          {state.observation && (
            <div className="connection-note">
              <strong>{pageNames[state.observation.page]}</strong>
              <p>{state.observation.origin}</p>
              {rejected ? (
                <p role="alert">
                  Tutup browser Flow dan kirim pesan penolakan. Aluraya tidak akan mengulang login
                  dengan konfigurasi penyamaran.
                </p>
              ) : (
                <p>
                  Status ini hanya mengenali alamat halaman. Login, akses proyek, saldo dan izin
                  generasi belum diverifikasi. Setelah proyek terbuka, kirim hasilnya tanpa data
                  akun sensitif.
                </p>
              )}
              <p>
                Diperiksa: {new Date(state.observation.checkedAtMs).toLocaleTimeString('id-ID')}.
              </p>
            </div>
          )}
        </>
      )}
      <p className="empty-note">
        Tahap pemeriksaan akses: belum ada pengiriman prompt, unggah referensi, Generate atau
        unduhan otomatis. Tutup jendela utama Aluraya untuk menutup seluruh browser milik aplikasi.
      </p>
    </section>
  );
}
