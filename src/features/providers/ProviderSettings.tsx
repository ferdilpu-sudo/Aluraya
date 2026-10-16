import { useState } from 'react';
import {
  newProviderProfile,
  providerConfigSchema,
  providerProfileSchema,
  providerProtocols,
  providerRoles,
  type ProviderProfile,
} from '../../contracts/providers';
import type { ProviderController } from './useProviderConfig';
const labels = { llm: 'LLM / Copilot', image: 'Gambar', video: 'Video' };
export function ProviderSettings({ config, error, save }: ProviderController) {
  const [editing, setEditing] = useState<ProviderProfile | null>(null);
  const [json, setJson] = useState('');
  const [notice, setNotice] = useState('');
  const [advancedDirty, setAdvancedDirty] = useState(false);
  function edit(profile: ProviderProfile) {
    setAdvancedDirty(false);
    setEditing(profile);
    setJson(JSON.stringify(profile, null, 2));
    setNotice('');
  }
  function apply() {
    try {
      const profile: unknown = JSON.parse(json);
      const candidate = providerConfigSchema.parse({
        ...config,
        profiles: [...config.profiles.filter((p) => p.id !== editing?.id), profile],
      });
      if (save(candidate)) {
        setEditing(null);
        setNotice('Konfigurasi disimpan. Koneksi API belum diuji.');
      }
    } catch {
      setNotice(
        'Konfigurasi tidak valid. Periksa role, protokol, URL, mapping, dan rute. Jangan masukkan API key.',
      );
    }
  }
  function patch(value: Partial<ProviderProfile>) {
    if (!editing) return;
    let source = editing;
    if (advancedDirty) {
      try {
        source = providerProfileSchema.parse(JSON.parse(json));
      } catch {
        setNotice('Perbaiki JSON profil sebelum mengubah field dasar, atau batalkan edit.');
        return;
      }
    }
    const next = { ...source, ...value };
    setAdvancedDirty(false);
    setEditing(next);
    setJson(JSON.stringify(next, null, 2));
  }
  return (
    <section className="provider-settings form-stack">
      <span className="eyebrow">KONEKSI YANG DAPAT DISESUAIKAN</span>
      <h2>API provider</h2>
      <p className="context-note">
        Pilih provider dan model untuk setiap peran. Ini skema konfigurasi; eksekutor API dan
        penyimpanan key belum tersambung.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {providerRoles.map((role) => (
        <div className="provider-role" key={role}>
          <label>
            {labels[role]}
            <select
              value={config.routing[role] ?? ''}
              onChange={(e) => {
                if (
                  save({
                    ...config,
                    routing: { ...config.routing, [role]: e.target.value || null },
                  })
                )
                  setNotice('Pilihan provider disimpan. Belum ada request API.');
              }}
            >
              <option value="">Belum dipilih</option>
              {config.profiles
                .filter((p) => p.role === role)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.model}
                  </option>
                ))}
            </select>
          </label>
          <button className="text-button" onClick={() => edit(newProviderProfile(role))}>
            + Tambah profil {labels[role]}
          </button>
        </div>
      ))}
      <div className="provider-list">
        {config.profiles.map((p) => (
          <div key={p.id}>
            <span>
              <strong>{p.name}</strong>
              <small>
                {labels[p.role]} · {p.protocol}
              </small>
            </span>
            <button className="text-button" onClick={() => edit(p)}>
              Edit
            </button>
            <button
              className="text-button danger"
              onClick={() => {
                if (!window.confirm('Hapus profil konfigurasi ini?')) return;
                const routing = { ...config.routing };
                for (const role of providerRoles) if (routing[role] === p.id) routing[role] = null;
                save({
                  ...config,
                  profiles: config.profiles.filter((x) => x.id !== p.id),
                  routing,
                });
              }}
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="provider-editor">
          <h3>Profil {labels[editing.role]}</h3>
          <label>
            Nama
            <input
              value={editing.name}
              maxLength={100}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label>
            Base URL
            <input value={editing.baseUrl} onChange={(e) => patch({ baseUrl: e.target.value })} />
          </label>
          <label>
            Endpoint
            <input value={editing.endpoint} onChange={(e) => patch({ endpoint: e.target.value })} />
          </label>
          <label>
            Model ID
            <input value={editing.model} onChange={(e) => patch({ model: e.target.value })} />
          </label>
          <label>
            Protokol
            <select
              value={editing.protocol}
              onChange={(e) => {
                const protocol = e.target.value as ProviderProfile['protocol'];
                patch({
                  protocol,
                  customMapping:
                    protocol === 'custom-http'
                      ? {
                          inputs: [{ source: 'prompt', target: '/prompt' }],
                          output: {
                            text: editing.role === 'llm' ? '/text' : null,
                            mediaUrl: editing.role === 'llm' ? null : '/url',
                            jobId: null,
                          },
                          polling: null,
                        }
                      : null,
                });
              }}
            >
              {providerProtocols
                .filter((p) => editing.role === 'llm' || p === 'custom-http')
                .map((p) => (
                  <option key={p}>{p}</option>
                ))}
            </select>
          </label>
          <details>
            <summary>Konfigurasi lengkap: auth, mapping, polling, biaya</summary>
            <p className="context-note">
              secretRef adalah nama slot key, bukan isi key. Field dalam JSON digunakan saat Simpan
              profil.
            </p>
            <textarea
              aria-label="JSON profil API"
              rows={16}
              value={json}
              onChange={(e) => {
                setJson(e.target.value);
                setAdvancedDirty(true);
              }}
              spellCheck={false}
            />
          </details>
          <div className="inline-actions">
            <button className="button primary" onClick={apply}>
              Simpan profil
            </button>
            <button className="button secondary" onClick={() => setEditing(null)}>
              Batal
            </button>
          </div>
        </div>
      )}
      <details className="provider-import">
        <summary>Impor / ekspor konfigurasi JSON</summary>
        <p className="context-note">
          Konfigurasi tidak memuat API key. Mengimpor akan mengganti konfigurasi koneksi saat ini.
        </p>
        <textarea
          aria-label="JSON konfigurasi API"
          value={editing ? '' : json}
          disabled={Boolean(editing)}
          rows={8}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="inline-actions">
          <button
            className="button secondary"
            disabled={Boolean(editing)}
            onClick={() => setJson(JSON.stringify(config, null, 2))}
          >
            Tampilkan JSON
          </button>
          <button
            className="button secondary"
            disabled={Boolean(editing) || !json}
            onClick={() => {
              try {
                if (json.length > 128000) throw new Error();
                const parsed = providerConfigSchema.parse(JSON.parse(json));
                if (window.confirm('Ganti konfigurasi koneksi dengan JSON ini?') && save(parsed))
                  setNotice('Konfigurasi diimpor. API belum terhubung.');
              } catch {
                setNotice('JSON tidak valid atau melebihi 128 KB.');
              }
            }}
          >
            Impor JSON
          </button>
        </div>
      </details>
      {notice && (
        <p className="context-note" role="status">
          {notice}
        </p>
      )}
      <p className="context-note">
        Model chat tidak otomatis bisa menghasilkan gambar/video. Harga dan kemampuan dalam
        konfigurasi adalah deklarasi, bukan hasil verifikasi layanan.
      </p>
    </section>
  );
}
