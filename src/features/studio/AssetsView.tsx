import type { ProjectUpdate } from '../../domain/studio';
import { useState } from 'react';
import {
  assetKinds,
  editShot,
  removeAsset,
  type StudioAsset,
  type StudioProject,
} from '../../domain/studio';
import { readReference } from '../../infrastructure/studioStorage';
import { Icon } from './Icon';
export function AssetsView({
  project,
  update,
  initialSelectedId = '',
}: {
  project: StudioProject;
  update: ProjectUpdate;
  initialSelectedId?: string;
}) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = project.assets.find((a) => a.id === selectedId);
  const assets = project.assets.filter((a) => filter === 'all' || a.kind === filter);
  function add(kind: StudioAsset['kind']) {
    const asset: StudioAsset = {
      id: crypto.randomUUID(),
      name: `${assetKinds[kind]} baru`,
      kind,
      description: '',
      image: null,
    };
    update({ ...project, assets: [...project.assets, asset] });
    setSelectedId(asset.id);
    setFilter('all');
  }
  function change(patch: Partial<StudioAsset>) {
    if (!selected) return;
    update({
      ...project,
      assets: project.assets.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)),
      shots: project.shots.map((s) =>
        s.references.includes(selected.id) ? editShot(s, { review: 'draft' }) : s,
      ),
    });
  }
  return (
    <section className="scroll-view assets-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">02 / DUNIA CERITA</span>
          <h2>Kenali setiap detail.</h2>
          <p>Satukan karakter, lokasi, dan properti sebagai referensi shot.</p>
        </div>
        <span className="page-number" aria-hidden="true">
          02
        </span>
      </div>
      <div className="asset-toolbar">
        <div className="filter-pills">
          {[['all', 'Semua'] as [string, string], ...Object.entries(assetKinds)].map(
            ([value, label]) => (
              <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {label}
              </button>
            ),
          )}
        </div>
        <details className="add-menu">
          <summary className="button primary">+ Tambah aset</summary>
          <div>
            {Object.entries(assetKinds).map(([kind, label]) => (
              <button
                key={kind}
                onClick={(e) => {
                  add(kind as StudioAsset['kind']);
                  e.currentTarget.closest('details')?.removeAttribute('open');
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="asset-grid">
        {assets.map((asset) => (
          <button
            className={`asset-card ${selectedId === asset.id ? 'active' : ''}`}
            key={asset.id}
            onClick={() => setSelectedId(asset.id)}
          >
            <div className={`asset-art ${asset.kind}`}>
              {asset.image ? (
                <img src={asset.image} alt={asset.name} />
              ) : (
                <Icon name="assets" size={38} />
              )}
            </div>
            <span className="eyebrow">{assetKinds[asset.kind]}</span>
            <strong>{asset.name || 'Tanpa nama'}</strong>
            <small>{asset.image ? 'Referensi lokal' : 'Belum ada gambar'}</small>
          </button>
        ))}
        <button className="asset-add" onClick={() => add('character')}>
          <Icon name="plus" size={28} />
          <strong>Tambahkan referensi</strong>
          <span>Bangun dunia cerita Anda</span>
        </button>
      </div>
      {selected && (
        <div className="asset-editor form-stack">
          <div className="section-heading">
            <h3>Detail aset</h3>
            <button className="text-button" onClick={() => setSelectedId('')}>
              Tutup
            </button>
          </div>
          <label>
            Nama
            <input
              value={selected.name}
              maxLength={120}
              onChange={(e) => change({ name: e.target.value })}
            />
          </label>
          <label>
            Deskripsi & kontinuitas
            <textarea
              rows={4}
              value={selected.description}
              maxLength={4000}
              onChange={(e) => change({ description: e.target.value })}
              placeholder="Ciri wajah, pakaian, tata ruang, warna, atau detail yang harus konsisten…"
            />
          </label>
          <div className="inline-actions">
            <label className="button secondary file-button">
              {busy ? 'Membaca gambar…' : 'Pilih gambar'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  setError('');
                  try {
                    const image = await readReference(file);
                    update((current) => ({
                      ...current,
                      assets: current.assets.map((a) =>
                        a.id === selected.id ? { ...a, image } : a,
                      ),
                      shots: current.shots.map((s) =>
                        s.references.includes(selected.id) ? editShot(s, { review: 'draft' }) : s,
                      ),
                    }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Gagal membaca gambar.');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {selected.image && (
              <button className="text-button" onClick={() => change({ image: null })}>
                Lepas gambar
              </button>
            )}
            <button
              className="text-button danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Hapus aset ini dari draf dan referensi shot? Berkas sumber tidak dihapus.',
                  )
                ) {
                  update(removeAsset(project, selected.id));
                  setSelectedId('');
                }
              }}
            >
              Hapus aset
            </button>
          </div>
          <small>
            JPG, PNG, WebP · maks. 4 MB. Gambar tersimpan lokal; unggah ke API provider menunggu
            sinkronisasi.
          </small>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
      )}
      <p className="context-note">
        Aset terhubung ke shot melalui panel detail. Mengubah referensi mengembalikan shot terkait
        ke status draf.
      </p>
    </section>
  );
}
