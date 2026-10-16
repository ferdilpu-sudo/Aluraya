import { useState } from 'react';
import type { LlmController } from './useLlm';
export function LlmKeyControls({
  controller,
  disabled,
}: {
  controller: LlmController;
  disabled: boolean;
}) {
  const [key, setKey] = useState('');
  const { state, execute } = controller;
  if (!state?.connection || state.connection.auth.type === 'none') return null;
  return (
    <div className="llm-key">
      <label>
        API key
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          maxLength={4096}
          disabled={disabled}
          onChange={(e) => setKey(e.target.value)}
        />
      </label>
      <small>
        {state.keyPresent
          ? 'Key tersimpan untuk tujuan koneksi ini.'
          : 'Belum ada key yang cocok dengan tujuan koneksi ini.'}{' '}
        Key disimpan terenkripsi untuk akun Windows ini.
      </small>
      <div className="inline-actions">
        <button
          className="button secondary"
          disabled={disabled || !key.trim()}
          onClick={() => {
            const value = key.trim();
            setKey('');
            void execute({ action: 'save_key', key: value });
          }}
        >
          Simpan key
        </button>
        <button
          className="text-button danger"
          disabled={disabled || !state.keyPresent}
          onClick={() => {
            if (window.confirm('Hapus key tersimpan untuk profil ini?'))
              void execute({ action: 'remove_key' });
          }}
        >
          Hapus key
        </button>
      </div>
    </div>
  );
}
