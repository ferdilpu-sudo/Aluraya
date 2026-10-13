import { useState } from 'react';
import { useFlow } from './useFlow';
import type { FlowSnapshot } from '../../contracts/flow';

const errors: Record<NonNullable<FlowSnapshot['error']>, string> = {
  WINDOWS_REQUIRED: 'Koneksi Flow tersedia melalui Aluraya Windows.',
  STORAGE_ERROR:
    'Daftar profil tidak dapat disimpan atau dibaca. Jangan hapus profil; tutup dan buka kembali aplikasi.',
  BROWSER_OPEN_FAILED:
    'Browser gagal dibuka. Pastikan browser pilihan terpasang dan profil Aluraya tidak terbuka di proses lain. Tutup jendela Flow lama lalu coba lagi.',
  NAVIGATION_FAILED: 'Halaman Flow gagal dimuat. Periksa koneksi lalu buka profil kembali.',
  BROWSER_CLOSED: 'Browser Flow belum terbuka atau sudah ditutup.',
  PROFILE_ACTIVE: 'Tutup profil Flow yang aktif sebelum membuka profil lain.',
  PROFILE_NOT_FOUND: 'Profil tidak ditemukan. Periksa ulang daftar profil.',
  OBSERVATION_FAILED:
    'Halaman belum dapat dibaca. Tunggu Flow selesai dimuat lalu periksa kembali.',
  BUSY: 'Tunggu operasi Flow selesai.',
};
const pageNames = {
  flow: 'Halaman Flow',
  login: 'Halaman login Google',
  login_rejected: 'Login ditolak Google',
  other: 'Halaman belum dikenali',
  closed: 'Tidak ada halaman',
};
export function FlowPanel() {
  const { state, error, pending, execute } = useFlow();
  const [browser, setBrowser] = useState<'chrome' | 'msedge'>('chrome');
  const busy = pending || !state || state.activity !== 'idle';
  const loginRejected = state?.observation?.page === 'login_rejected';
  return (
    <section className="copilot" aria-labelledby="flow-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KONEKSI GAMBAR & VIDEO</span>
          <h2 id="flow-title">Google Flow</h2>
        </div>
      </div>
      <div className="connection-note">
        <strong>Profil browser khusus Aluraya</strong>
        <p>
          Login sendiri di jendela browser yang dibuka. Profil ini terpisah dari browser harian
          Anda. Satu profil aktif pada satu waktu.
        </p>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {state?.error && (
        <p className="error" role="alert">
          {errors[state.error]}
        </p>
      )}
      {!state && (
        <button className="button secondary" onClick={() => void execute({ action: 'inspect' })}>
          Periksa koneksi desktop
        </button>
      )}
      <label htmlFor="flow-browser">Browser untuk profil baru</label>
      <select
        id="flow-browser"
        disabled={busy}
        value={browser}
        onChange={(event) => setBrowser(event.target.value as 'chrome' | 'msedge')}
      >
        <option value="chrome">Google Chrome</option>
        <option value="msedge">Microsoft Edge</option>
      </select>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void execute({ action: 'create', browser })}
      >
        Tambah profil Flow
      </button>
      {state && (
        <>
          <ul className="check-list">
            {state.profiles.map((profile, index) => (
              <li key={profile.id}>
                <div>
                  <strong>
                    Profil {state.profilePage * 10 + index + 1} ·{' '}
                    {profile.browser === 'chrome' ? 'Chrome' : 'Edge'}
                  </strong>
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
            <p className="empty-note">Tambahkan profil untuk mulai login Flow.</p>
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
            {busy
              ? 'Sedang memproses…'
              : loginRejected
                ? 'Koneksi Flow terhenti: Google menolak login browser ini.'
                : state.browserOpen
                  ? 'Browser terbuka. Login dan buka proyek Flow untuk diperiksa.'
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
              {loginRejected ? (
                <p role="alert">
                  Google menolak login browser ini. Tutup browser Flow dan simpan pesan
                  penolakannya. Integrasi menunggu jalur akses yang didukung; jangan ulangi login
                  otomatis atau pindahkan cookie dari browser lain.
                </p>
              ) : (
                <>
                  <p>
                    Kolom input terlihat: {state.observation.editorVisible ? 'Ya' : 'Belum'}. Ini
                    belum membuktikan izin generasi.
                  </p>
                  <p>
                    Label model terlihat:{' '}
                    {state.observation.modelLabels.join(', ') || 'Belum terbaca'}
                  </p>
                  <p>
                    Teks kredit terlihat:{' '}
                    {state.observation.creditLabels.join(' · ') || 'Belum terbaca'}
                  </p>
                  <p>
                    Diperiksa: {new Date(state.observation.observedAt).toLocaleTimeString('id-ID')}.
                    Buka menu akun untuk saldo atau pengaturan prompt untuk model, lalu periksa
                    lagi.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
      <p className="empty-note">
        Tahap koneksi: biaya per hasil dan kemampuan akun belum terverifikasi. Pengiriman prompt,
        unggah referensi dan Generate belum diaktifkan. Jika Google menolak login, kirim pesan yang
        tampil.
      </p>
    </section>
  );
}
