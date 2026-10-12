import { useState } from 'react';
import { useChat } from './useChat';
import { ChatConnection } from './ChatConnection';
import { chatErrors } from './chatErrors';
import type { ChatAction, ChatSnapshot } from '../../contracts/chat';

function Conversation({
  state,
  busy,
  execute,
}: {
  state: ChatSnapshot;
  busy: boolean;
  execute: (action: ChatAction) => Promise<ChatSnapshot | null>;
}) {
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState<
    Array<{ id: string; prompt: string; answer: string; status: string }>
  >([]);
  const selected = state.models.some((item) => item.id === model)
    ? model
    : (state.models[0]?.id ?? '');
  async function send() {
    const text = draft.trim();
    const result = await execute({ action: 'send', text, model: selected });
    if (result?.reply?.state === 'streaming' && result.activity === 'reply') {
      const id = result.reply.id;
      setMessages((previous) => [
        ...previous.map((message) =>
          message.id === state.reply?.id
            ? { ...message, answer: state.reply.text, status: state.reply.state }
            : message,
        ),
        { id, prompt: text, answer: '', status: 'streaming' },
      ]);
      setDraft('');
    }
  }
  return (
    <>
      <div className="chat-actions">
        <button
          className="text-button"
          disabled={busy || !state.signedIn}
          onClick={() => void execute({ action: 'models' })}
        >
          Lihat / perbarui model
        </button>
        <button
          className="text-button"
          disabled={busy}
          onClick={async () => {
            const result = await execute({ action: 'clear' });
            if (result && !result.reply) setMessages([]);
          }}
        >
          Percakapan baru
        </button>
      </div>
      <label htmlFor="chat-model">Model akun</label>
      <select
        id="chat-model"
        value={selected}
        disabled={busy || !state.models.length}
        onChange={(event) => setModel(event.target.value)}
      >
        {!state.models.length && <option value="">Daftar model belum tersedia</option>}
        {state.models.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <div className="chat-messages" aria-label="Percakapan">
        {!messages.length && !state.reply && (
          <p className="empty-note">
            Mulai dengan pesan singkat untuk membuktikan koneksi. Percakapan ini hanya disimpan
            selama aplikasi terbuka.
          </p>
        )}
        {messages.map((message) => {
          const current = state.reply?.id === message.id ? state.reply : null;
          return (
            <article key={message.id}>
              <strong>Anda</strong>
              <p>{message.prompt}</p>
              <strong>ChatGPT</strong>
              <p>{current?.text ?? message.answer}</p>
              <small>
                {(current?.state ?? message.status) === 'completed'
                  ? 'Selesai'
                  : (current?.state ?? message.status) === 'streaming'
                    ? 'Merespons…'
                    : 'Respons parsial'}
              </small>
            </article>
          );
        })}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <label htmlFor="message">Pesan untuk copilot</label>
        <textarea
          id="message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={4000}
          disabled={busy || !state.planConfirmed || !selected || state.usagePaused}
          placeholder="Ceritakan ide Anda…"
          rows={3}
          aria-describedby="chat-help"
        />
        <div className="composer-footer">
          <span id="chat-help">
            {state.planEnabled ? 'Using ChatGPT plan' : 'Menunggu izin paket'}
          </span>
          <button
            className="button primary"
            disabled={
              busy || !state.planConfirmed || !selected || !draft.trim() || state.usagePaused
            }
          >
            Kirim ↑
          </button>
        </div>
      </form>
    </>
  );
}
export function CopilotPanel() {
  const { state, error, pending, execute } = useChat();
  const busy = pending || state?.activity !== 'idle';
  return (
    <section className="copilot" aria-labelledby="copilot-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PARTNER BERCERITA</span>
          <h2 id="copilot-title">Copilot</h2>
        </div>
        <span className="copilot-symbol" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="copilot-intro">
        <p>Ide Anda. Arah cerita Anda.</p>
        <span>Hubungkan ChatGPT untuk mulai mengembangkan cerita. Produksi Flow belum aktif.</span>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!state && (
        <button className="button secondary" onClick={() => void execute({ action: 'inspect' })}>
          Periksa koneksi
        </button>
      )}
      {state && (
        <>
          <ChatConnection
            key={state.accountId ?? 'new'}
            state={state}
            busy={busy}
            execute={execute}
          />
          {state.error && (
            <p role="alert" className="error">
              {chatErrors[state.error]}
            </p>
          )}
          <Conversation
            key={`${state.accountId ?? 'new'}:${state.signedIn}`}
            state={state}
            busy={busy}
            execute={execute}
          />
        </>
      )}
    </section>
  );
}
