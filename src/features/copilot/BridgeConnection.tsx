import type { ChatAction, ChatSnapshot } from '../../contracts/chat';

type Props = {
  state: ChatSnapshot;
  busy: boolean;
  execute: (action: ChatAction) => Promise<ChatSnapshot | null>;
};

/** Pairing must be initiated by the user inside Aluraya. */
export function BridgeConnection({ state, busy, execute }: Props) {
  const available =
    state.signedIn &&
    state.planEnabled &&
    state.planConfirmed &&
    !state.usagePaused &&
    state.models.length > 0;
  return (
    <div className="connection-note" aria-label="Koneksi lokal Switchly">
      <strong>Hubungkan ke Switchly Copilot</strong>
      <p>
        Aktifkan hanya ketika Anda ingin menggunakan akun ChatGPT ini di Switchly. Koneksi memakai
        Windows Named Pipe lokal dan kode sementara. Kata sandi, cookie dan token ChatGPT tidak
        dikirim ke Switchly.
      </p>
      {state.bridgeCode ? (
        <>
          <label htmlFor="bridge-code">Kode pasangan sesi saat ini</label>
          <input
            id="bridge-code"
            type="text"
            value={state.bridgeCode}
            readOnly
            spellCheck={false}
            aria-label="Salin kode pasangan untuk Switchly"
          />
          <p role="status">
            {state.bridgeActive
              ? 'Bridge lokal aktif. Salin kode ke menu Copilot Agent di Switchly.'
              : 'Membuka bridge lokal. Jika gagal, nonaktifkan lalu coba lagi.'}
          </p>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => void execute({ action: 'bridge_disable' })}
          >
            Putuskan koneksi Switchly
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button secondary"
          disabled={!available || busy}
          onClick={() => void execute({ action: 'bridge_enable' })}
        >
          Aktifkan koneksi Switchly
        </button>
      )}
      {!available && <p>Koneksi memerlukan login dan persetujuan paket yang aktif.</p>}
    </div>
  );
}
