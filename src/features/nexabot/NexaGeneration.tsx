import { useState } from 'react';
import { generationSchema, type GenerationInput } from '../../contracts/nexabot';
import type { NexaController } from './useNexabot';
export function NexaGeneration({ state, pending, execute }: NexaController) {
  const [mode, setMode] = useState<'img' | 't2v'>('img');
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<1 | 2 | 5>(2);
  const [ratio, setRatio] = useState<1 | 2>(1);
  const [resolution, setResolution] = useState<720 | 1080>(720);
  const [approved, setApproved] = useState(false);
  const input: GenerationInput =
    mode === 'img'
      ? { mode, prompt: prompt.trim(), aspect }
      : { mode, prompt: prompt.trim(), ratio, resolution };
  const busy = pending || !state || state.activity !== 'idle';
  const quote = state?.quote;
  const matches =
    quote && JSON.stringify(quote.input) === JSON.stringify(input) && Date.now() < quote.expiresAt;
  return (
    <section
      className="nexa-section"
      aria-label="Generasi Nexabot"
      onChange={() => setApproved(false)}
    >
      <h3>Gambar dan video pertama</h3>
      <label>
        Jenis hasil
        <select value={mode} onChange={(event) => setMode(event.target.value as 'img' | 't2v')}>
          <option value="img">Gambar dari teks</option>
          <option value="t2v">Video dari teks</option>
        </select>
      </label>
      <label>
        Prompt
        <textarea
          value={prompt}
          rows={6}
          maxLength={4000}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Deskripsikan satu gambar atau adegan…"
        />
      </label>
      {mode === 'img' ? (
        <label>
          Rasio
          <select
            value={aspect}
            onChange={(event) => setAspect(Number(event.target.value) as 1 | 2 | 5)}
          >
            <option value={2}>16:9</option>
            <option value={5}>9:16</option>
            <option value={1}>1:1</option>
          </select>
        </label>
      ) : (
        <div className="nexa-actions">
          <label>
            Rasio
            <select
              value={ratio}
              onChange={(event) => setRatio(Number(event.target.value) as 1 | 2)}
            >
              <option value={1}>16:9</option>
              <option value={2}>9:16</option>
            </select>
          </label>
          <label>
            Resolusi
            <select
              value={resolution}
              onChange={(event) => setResolution(Number(event.target.value) as 720 | 1080)}
            >
              <option value={720}>720p</option>
              <option value={1080}>1080p</option>
            </select>
          </label>
        </div>
      )}
      <p>
        <small>
          Model dan durasi ditentukan Nexabot; API ini tidak menyediakan pilihannya. Referensi
          gambar/video belum tersedia pada tahap ini.
        </small>
      </p>
      <button
        className="button"
        disabled={
          busy ||
          !state?.configured ||
          !!state.activeId ||
          !generationSchema.safeParse(input).success
        }
        onClick={() => {
          setApproved(false);
          void execute({ action: 'prepare', input });
        }}
      >
        Periksa biaya
      </button>
      {matches && (
        <div className="nexa-approval" onChange={(event) => event.stopPropagation()}>
          <strong>1 request · {quote.cost} kredit Nexabot</strong>
          <p>
            Input di atas akan dikirim ke Nexabot. Persetujuan berlaku dua menit, untuk satu kali
            pengiriman.
          </p>
          <label className="nexa-checkbox">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
            />
            Saya menyetujui input dan biaya ini.
          </label>
          <button
            className="button primary"
            disabled={busy || !approved}
            onClick={() => {
              setApproved(false);
              void execute({ action: 'submit', approvalId: quote.id });
            }}
          >
            Generate · {quote.cost} kredit
          </button>
        </div>
      )}
    </section>
  );
}
