import { useState } from 'react';
import type { PlanSource } from '../../contracts/proposal';
import type { StudioProject } from '../../domain/studio';
export function PlannerControls({
  project,
  disabled,
  build,
}: {
  project: StudioProject;
  disabled: boolean;
  build: (text: string, kind: PlanSource['sourceKind']) => void;
}) {
  const [source, setSource] = useState(project.script.length <= 3000 ? project.script : '');
  const [kind, setKind] = useState<PlanSource['sourceKind']>('excerpt');
  return (
    <fieldset className="form-stack" disabled={disabled}>
      <legend>Usulan untuk canvas</legend>
      <label>
        Jenis sumber
        <select value={kind} onChange={(e) => setKind(e.target.value as PlanSource['sourceKind'])}>
          <option value="idea">Ide / premis</option>
          <option value="excerpt">Cuplikan naskah</option>
          <option value="full">Naskah lengkap</option>
        </select>
      </label>
      <label>
        Teks sumber dari naskah proyek
        <textarea
          rows={5}
          maxLength={6000}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Salin bagian naskah yang akan direncanakan…"
        />
      </label>
      <button
        className="text-button"
        disabled={!project.script.trim() || project.script.length > 6000}
        onClick={() => setSource(project.script)}
      >
        Muat naskah saat ini
      </button>
      <small>
        Sumber, pengaturan proyek, deskripsi aset dan judul shot akan masuk ke pesan. Gambar tidak
        dikirim. Naskah panjang: pilih cuplikan sendiri.
      </small>
      <button
        className="button secondary"
        disabled={!source.trim()}
        onClick={() => build(source, kind)}
      >
        Siapkan usulan aset &amp; shot
      </button>
      <small>
        Langkah ini hanya menyusun pesan. Periksa pesan dan tarif, lalu setujui request di bawah.
        Mengedit pesan mengubahnya menjadi chat teks biasa; siapkan ulang usulan untuk mengaktifkan
        review canvas.
      </small>
    </fieldset>
  );
}
