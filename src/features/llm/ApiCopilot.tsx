import { useState } from 'react';
import type { ProviderProfile } from '../../contracts/providers';
import type { ProjectUpdate, StudioProject } from '../../domain/studio';
import { llmConnection, type LlmConnection } from '../../contracts/llm';
import { PlannerControls } from '../planning/PlannerControls';
import { ProposalReview } from '../planning/ProposalReview';
import { usePlanWorkflow } from '../planning/usePlanWorkflow';
import { useLlm } from './useLlm';
import { LlmKeyControls } from './LlmKeyControls';
import { LlmRequestReview } from './LlmRequestReview';
import { llmErrors } from './errors';
export function ApiCopilot({
  profile,
  project,
  update,
}: {
  profile: ProviderProfile | undefined;
  project: StudioProject;
  update: ProjectUpdate;
}) {
  const controller = useLlm();
  const { state, pending, error, execute } = controller;
  const [text, setText] = useState('');
  const [maxTokens, setMaxTokens] = useState(1024);
  const [limitField, setLimitField] =
    useState<LlmConnection['tokenLimitField']>('max_completion_tokens');
  const [currency, setCurrency] = useState('USD');
  const [inputRate, setInputRate] = useState('');
  const [outputRate, setOutputRate] = useState('');
  const [perRequest, setPerRequest] = useState('0');
  const [checked, setChecked] = useState(false);
  let connection: LlmConnection | null = null;
  try {
    if (profile) connection = llmConnection(profile, limitField);
  } catch {
    /* Unsupported profiles remain configuration only. */
  }
  const planner = usePlanWorkflow(project, connection, state?.reply ?? null);
  const busy = pending || Boolean(state && state.activity !== 'idle');
  const active = Boolean(
    connection && JSON.stringify(connection) === JSON.stringify(state?.connection),
  );
  const ready = active && !busy && (state?.connection?.auth.type === 'none' || state?.keyPresent);
  const rateValues = [inputRate, outputRate, perRequest];
  const validRates =
    checked &&
    /^[A-Z]{3,8}$/.test(currency) &&
    rateValues.every(
      (v) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 1e9,
    );
  const currentQuote =
    state?.quote &&
    active &&
    state.quote.text === text.trim() &&
    state.quote.maxTokens === maxTokens &&
    checked &&
    state.quote.tariff.currency === currency &&
    state.quote.tariff.inputPerMillion === Number(inputRate) &&
    state.quote.tariff.outputPerMillion === Number(outputRate) &&
    state.quote.tariff.perRequest === Number(perRequest)
      ? state.quote
      : null;
  function editText(value: string) {
    setText(value);
    planner.edit();
    if (state?.quote) void execute({ action: 'cancel' });
  }
  return (
    <div className="api-copilot form-stack">
      <h3>Copilot API</h3>
      <p>
        Chat Completions teks, satu request per persetujuan. Pesan sebelumnya dan konteks proyek
        tidak dikirim otomatis.
      </p>
      {!connection && (
        <p className="context-note">
          Pilih profil LLM berprotokol Chat Completions pada Koneksi API. Protokol lain belum
          memiliki executor.
        </p>
      )}
      <label>
        Parameter batas output
        <select
          value={limitField}
          disabled={busy}
          onChange={(e) => setLimitField(e.target.value as LlmConnection['tokenLimitField'])}
        >
          <option value="max_completion_tokens">max_completion_tokens</option>
          <option value="max_tokens">max_tokens (provider kompatibel lama)</option>
        </select>
      </label>
      <button
        className="button secondary"
        disabled={busy || !connection}
        onClick={() => {
          if (connection) {
            setChecked(false);
            void execute({ action: 'configure', connection });
          }
        }}
      >
        {active ? 'Muat ulang status key' : 'Gunakan profil ini'}
      </button>
      <p className="context-note">
        {active
          ? 'Profil diterapkan. Menyimpan key belum membuktikan koneksi layanan.'
          : 'Terapkan profil sebelum mengirim.'}
      </p>
      {active && (
        <LlmKeyControls
          key={JSON.stringify(state?.connection)}
          controller={controller}
          disabled={busy}
        />
      )}
      <PlannerControls
        key={project.id}
        project={project}
        disabled={busy || !active}
        build={(source, kind) => {
          const plan = planner.build(source, kind);
          if (plan) {
            setText(plan.prompt);
            setMaxTokens(4096);
            if (state?.quote) void execute({ action: 'cancel' });
          }
        }}
      />
      {planner.error && (
        <p role="alert" className="error">
          {planner.error}
        </p>
      )}
      {planner.stale && (
        <p role="alert" className="error">
          Proyek atau profil berubah. Siapkan ulang usulan sebelum mengirim request.
        </p>
      )}
      <label>
        Pesan untuk Copilot
        <textarea
          rows={6}
          maxLength={6000}
          value={text}
          disabled={busy}
          onChange={(e) => editText(e.target.value)}
          placeholder="Tulis permintaan atau masukkan naskah yang ingin dibahas…"
        />
      </label>
      <button
        className="text-button"
        disabled={busy || !project.script.trim() || project.script.length > 5600}
        onClick={() =>
          editText(
            `Tinjau naskah berikut. Berikan usulan aset dan shot sebagai teks untuk saya tinjau; jangan menganggap cuplikan sebagai cerita lengkap.\n\n${project.script}`,
          )
        }
      >
        Masukkan naskah ke pesan
      </button>
      {project.script.length > 5600 && (
        <small>Naskah panjang: pilih cuplikan sendiri; tidak dipotong otomatis.</small>
      )}
      <label>
        Batas output token
        <input
          type="number"
          min={1}
          max={4096}
          value={maxTokens}
          disabled={busy}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
        />
      </label>
      <details className="llm-pricing">
        <summary>Tarif untuk request ini</summary>
        <p>
          Isi tarif model yang sudah Anda periksa di provider. Untuk layanan lokal gratis, isi 0.
          Jangan menganggap tarif contoh sebagai harga layanan.
        </p>
        <label>
          Mata uang / kredit
          <input
            value={currency}
            maxLength={8}
            disabled={busy}
            onChange={(e) => {
              setCurrency(e.target.value.toUpperCase());
              setChecked(false);
            }}
          />
        </label>
        {(
          [
            ['Input per 1 juta token', inputRate, setInputRate],
            ['Output per 1 juta token', outputRate, setOutputRate],
            ['Tambahan per request', perRequest, setPerRequest],
          ] as const
        ).map(([label, value, setter]) => (
          <label key={label}>
            {label}
            <input
              type="number"
              min={0}
              step="any"
              value={value}
              disabled={busy}
              onChange={(e) => {
                setter(e.target.value);
                setChecked(false);
              }}
            />
          </label>
        ))}
        <label className="llm-checkbox">
          <input
            type="checkbox"
            checked={checked}
            disabled={busy}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Saya sudah memeriksa tarif model dan biaya tambahan provider untuk request ini.
        </label>
      </details>
      <div className="inline-actions">
        <button
          className="button secondary"
          disabled={
            !ready ||
            planner.stale ||
            !validRates ||
            !text.trim() ||
            !Number.isInteger(maxTokens) ||
            maxTokens < 1 ||
            maxTokens > 4096
          }
          onClick={() =>
            void execute({
              action: 'prepare',
              text,
              maxTokens,
              tariff: {
                currency,
                inputPerMillion: Number(inputRate),
                outputPerMillion: Number(outputRate),
                perRequest: Number(perRequest),
                checkedByUser: true,
              },
            })
          }
        >
          Tinjau request
        </button>
        <button
          className="text-button"
          disabled={!state?.quote && state?.activity !== 'request'}
          onClick={() => void execute({ action: 'cancel' })}
        >
          Batalkan / hentikan menunggu
        </button>
      </div>
      {!validRates && <small>Isi dan konfirmasi tarif untuk membuka review request.</small>}
      {currentQuote && state?.connection && (
        <LlmRequestReview
          key={currentQuote.id}
          quote={currentQuote}
          connection={state.connection}
          disabled={busy || planner.stale}
          submit={() => {
            if (planner.bind(currentQuote.id, currentQuote.text))
              void execute({ action: 'submit', approvalId: currentQuote.id });
          }}
        />
      )}
      <p role="status">
        {state?.activity === 'storage'
          ? 'Mengakses penyimpanan key Windows…'
          : state?.activity === 'request'
            ? 'Menunggu respons provider…'
            : ''}
      </p>
      {(error || state?.error) && (
        <p role="alert" className="error">
          {error || (state?.error && llmErrors[state.error])}
        </p>
      )}
      {state?.reply && (
        <div className="llm-reply">
          <strong>
            {state.reply.state === 'completed'
              ? 'Respons selesai'
              : 'Respons terpotong pada batas token'}
          </strong>
          <pre>{state.reply.text}</pre>
          <small>
            Token dilaporkan provider: input {state.reply.inputTokens ?? 'tidak tersedia'} · output{' '}
            {state.reply.outputTokens ?? 'tidak tersedia'}. Penerapan ke canvas melalui review
            usulan.
          </small>
        </div>
      )}
      {planner.responseError && (
        <p role="alert" className="error">
          {planner.responseError}
        </p>
      )}
      {planner.proposal && (
        <ProposalReview
          key={planner.proposal.requestId}
          project={project}
          proposal={planner.proposal}
          update={update}
        />
      )}
    </div>
  );
}
