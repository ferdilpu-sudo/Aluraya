import { useState } from 'react';
import type { ChatAction, ChatSnapshot } from '../../contracts/chat';

interface Props {
  state: ChatSnapshot;
  busy: boolean;
  execute: (action: ChatAction) => Promise<ChatSnapshot | null>;
}
export function ChatConnection({ state, busy, execute }: Props) {
  const [reviewed, setReviewed] = useState(false);
  return (
    <div className="connection-note">
      <strong>
        {state.signedIn ? (state.email ?? 'Akun ChatGPT terhubung') : 'Hubungkan akun ChatGPT'}
      </strong>
      {state.accounts.length > 0 && (
        <>
          <label htmlFor="chat-account">Akun tersimpan</label>
          <select
            id="chat-account"
            value={
              state.accounts.some((account) => account.id === state.accountId)
                ? (state.accountId ?? '')
                : ''
            }
            disabled={busy}
            onChange={(event) => void execute({ action: 'select', accountId: event.target.value })}
          >
            <option value="" disabled>
              Pilih akun
            </option>
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
          {state.accountCount > 10 && (
            <div className="chat-actions">
              <button
                className="text-button"
                disabled={busy || state.accountPage === 0}
                onClick={() => void execute({ action: 'accounts', page: state.accountPage - 1 })}
              >
                Sebelumnya
              </button>
              <button
                className="text-button"
                disabled={busy || (state.accountPage + 1) * 10 >= state.accountCount}
                onClick={() => void execute({ action: 'accounts', page: state.accountPage + 1 })}
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
      <p>Login dibuka di browser. Pesan dikirim hanya saat Anda menekan Kirim.</p>
      <div className="chat-actions">
        <button
          className="button chatgpt-signin"
          disabled={busy}
          onClick={() => void execute({ action: 'login', addAccount: false })}
        >
          Continue with ChatGPT
        </button>
        {state.accountId && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => void execute({ action: 'login', addAccount: true })}
          >
            Tambah akun
          </button>
        )}
        {state.signedIn && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => void execute({ action: 'logout' })}
          >
            Keluar
          </button>
        )}
      </div>
      {state.planEnabled && !state.planConfirmed && (
        <div className="plan-confirmation">
          <strong>
            {state.welcomePending ? 'Anda menggunakan paket ChatGPT' : 'Periksa penggunaan paket'}
          </strong>
          <p>
            Aluraya memakai kuota akun. Di Manage usage, nonaktifkan penggunaan kredit tambahan
            untuk Aluraya bila hanya ingin memakai kuota langganan.
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={reviewed}
              disabled={busy}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            Saya sudah meninjau pengaturan dan menonaktifkan kredit tambahan.
          </label>
          <button
            className="button secondary"
            disabled={busy || !reviewed}
            onClick={() => void execute({ action: 'confirm_plan' })}
          >
            Mengerti, lanjutkan
          </button>
        </div>
      )}
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void execute({ action: 'usage' })}
      >
        Manage usage ↗
      </button>
      {state.activity !== 'idle' && (
        <p role="status">
          {state.activity === 'login'
            ? 'Selesaikan login di browser…'
            : state.activity === 'reply'
              ? 'ChatGPT sedang merespons…'
              : 'Memproses koneksi…'}
        </p>
      )}
      {['login', 'reply', 'models'].includes(state.activity) && (
        <button className="button secondary" onClick={() => void execute({ action: 'cancel' })}>
          Batalkan
        </button>
      )}
    </div>
  );
}
