import { useState } from 'react';
import { apiKeySchema } from '../../contracts/nexabot';
import type { NexaController } from './useNexabot';
export function NexaConnection({ state, pending, execute }: NexaController) {
  const [key, setKey] = useState('');
  const busy = pending || !state || state.activity !== 'idle';
  return (
    <section className="nexa-section" aria-label="API key Nexabot">
      <h3>Koneksi Nexabot</h3>
      <p>API memakai saldo kredit. Paket unlimited tidak berlaku.</p>
      <label>
        API key
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder={state?.configured ? 'Key tersimpan terenkripsi' : 'nxb_…'}
        />
      </label>
      <div className="nexa-actions">
        <button
          className="button"
          disabled={busy || !apiKeySchema.safeParse(key.trim()).success}
          onClick={() => {
            void execute({ action: 'save_key', key: key.trim() });
            setKey('');
          }}
        >
          Simpan key
        </button>
        <button
          className="text-button"
          disabled={busy || !state?.configured}
          onClick={() => void execute({ action: 'remove_key' })}
        >
          Hapus key
        </button>
        <button
          className="button"
          disabled={busy || !state?.configured}
          onClick={() => void execute({ action: 'credit' })}
        >
          Cek saldo
        </button>
      </div>
      {state?.credit && (
        <p role="status">
          Saldo: <strong>{state.credit.balance} kredit</strong> · {state.credit.cost} kredit/request
          <br />
          <small>Diperiksa {new Date(state.credit.checkedAt).toLocaleTimeString('id-ID')}</small>
        </p>
      )}
      <small>Key dilindungi akun Windows Anda dan tidak disertakan dalam hasil.</small>
    </section>
  );
}
