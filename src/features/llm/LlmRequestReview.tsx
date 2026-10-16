import { useState } from 'react';
import type { LlmSnapshot } from '../../contracts/llm';
export function LlmRequestReview({
  quote,
  connection,
  disabled,
  submit,
}: {
  quote: NonNullable<LlmSnapshot['quote']>;
  connection: NonNullable<LlmSnapshot['connection']>;
  disabled: boolean;
  submit: () => void;
}) {
  const [approved, setApproved] = useState(false);
  return (
    <div className="llm-review">
      <strong>Tinjau satu request</strong>
      <p className="llm-destination">
        {connection.baseUrl}
        {connection.endpoint}
        <br />
        Model: {connection.model}
      </p>
      <p>
        {quote.tariff.currency} · input {quote.tariff.inputPerMillion}/1 juta token · output{' '}
        {quote.tariff.outputPerMillion}/1 juta token · tambahan {quote.tariff.perRequest}/request.
      </p>
      <p>
        Batas output: {quote.maxTokens} token. Tarif dikonfirmasi oleh Anda; aplikasi belum
        memverifikasi tagihan provider. Batas token bukan batas nominal tagihan.
      </p>
      <details>
        <summary>Isi yang dikirim</summary>
        <pre>{quote.text}</pre>
      </details>
      <label className="llm-checkbox">
        <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        Saya menyetujui satu request dengan tujuan, isi dan tarif di atas.
      </label>
      <button
        className="button primary"
        disabled={disabled || !approved || Date.now() >= quote.expiresAt}
        onClick={() => {
          setApproved(false);
          submit();
        }}
      >
        Kirim satu request
      </button>
      <small>Review berlaku 2 menit. Tidak ada retry otomatis.</small>
    </div>
  );
}
