import type { ChatSnapshot } from '../../contracts/chat';
import { chatErrors } from './chatErrors';

export function ChatFailure({ state }: { state: ChatSnapshot }) {
  if (!state.error) return null;
  const info = state.diagnostic;
  return (
    <div role="alert" className="error">
      <p>{chatErrors[state.error]}</p>
      {info && (
        <details>
          <summary>Rincian kegagalan</summary>
          <p>Salin rincian ini atau kirim screenshot untuk pemeriksaan.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {[
              `Tahap: ${info.stage}`,
              `HTTP: ${info.status}`,
              `Bentuk: ${info.shape}`,
              `Kode: ${info.code ?? state.error}`,
              `Parameter: ${info.param ?? '-'}`,
              `Request ID: ${info.requestId ?? '-'}`,
            ].join('\n')}
          </pre>
        </details>
      )}
    </div>
  );
}
