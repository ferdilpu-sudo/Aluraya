import type { ProjectUpdate } from '../../domain/studio';
import type { StudioProject } from '../../domain/studio';
export function ScriptEditor({
  project,
  update,
  next,
}: {
  project: StudioProject;
  update: ProjectUpdate;
  next: () => void;
}) {
  const words = project.script.trim().split(/\s+/).filter(Boolean).length;
  return (
    <section className="script-view scroll-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">01 / MULAI DARI CERITA</span>
          <h2>
            Setiap adegan dimulai
            <br />
            dengan sebuah ide.
          </h2>
          <p>Tulis premis, tempel naskah, atau kembangkan cerita bersama Copilot.</p>
        </div>
        <span className="page-number" aria-hidden="true">
          01
        </span>
      </div>
      <div className="project-fields">
        <label>
          Judul proyek
          <input
            value={project.name}
            maxLength={120}
            onChange={(e) => {
              if (e.target.value.trim()) update({ ...project, name: e.target.value });
            }}
          />
        </label>
        <label>
          Format
          <select
            value={project.ratio}
            onChange={(e) =>
              update({ ...project, ratio: e.target.value as StudioProject['ratio'] })
            }
          >
            <option>16:9</option>
            <option>9:16</option>
          </select>
        </label>
        <label>
          Target durasi (detik)
          <input
            type="number"
            min={1}
            max={36000}
            value={project.targetSeconds}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n) && n > 0 && n <= 36000)
                update({ ...project, targetSeconds: n });
            }}
          />
        </label>
      </div>
      <div className="script-paper">
        <div className="paper-heading">
          <label htmlFor="script-input">Naskah & ide</label>
          <span>{words.toLocaleString('id-ID')} kata</span>
        </div>
        <textarea
          id="script-input"
          placeholder={
            'JUDUL CERITA\n\nINT. LOKASI — PAGI\n\nApa yang terlihat? Siapa yang hadir? Apa yang berubah?\n\nMulai menulis di sini…'
          }
          value={project.script}
          maxLength={200000}
          onChange={(e) => update({ ...project, script: e.target.value })}
        />
        <div className="paper-footer">
          <span>Teks asli Anda · dapat diedit kapan saja</span>
          <span>{project.script.length.toLocaleString('id-ID')} / 200.000</span>
        </div>
      </div>
      <fieldset className="adaptation">
        <legend>Arah pengembangan</legend>
        {(
          [
            ['preserve', 'Pertahankan', 'Jaga cerita dan dialog asli.'],
            ['adapt', 'Adaptasi', 'Izinkan penyesuaian untuk visual.'],
            ['expand', 'Kembangkan', 'Buka ruang untuk adegan baru.'],
          ] as const
        ).map(([value, label, desc]) => (
          <label key={value} className={project.adaptation === value ? 'active' : ''}>
            <input
              type="radio"
              name="adaptation"
              value={value}
              checked={project.adaptation === value}
              onChange={() => update({ ...project, adaptation: value })}
            />
            <strong>{label}</strong>
            <small>{desc}</small>
          </label>
        ))}
      </fieldset>
      <div className="view-footer">
        <span>Perencanaan lokal. Belum mengirim apa pun ke AI.</span>
        <button className="button primary" onClick={next}>
          Lanjut ke aset →
        </button>
      </div>
    </section>
  );
}
