import { describe, expect, it, vi } from 'vitest';
import {
  llmActionSchema,
  llmConnection,
  llmSnapshotSchema,
  type LlmConnection,
} from '../src/contracts/llm';
import { newProviderProfile } from '../src/contracts/providers';
import { LlmSession } from '../sidecar/src/llm/session';
import { LlmError, chatCompletion } from '../sidecar/src/llm/chatCompletions';
import { secretScope, type LlmSecretStore } from '../sidecar/src/llm/secretStore';
const connection = llmConnection(newProviderProfile('llm'), 'max_completion_tokens');
const tariff = {
  currency: 'USD',
  inputPerMillion: 1,
  outputPerMillion: 2,
  perRequest: 0,
  checkedByUser: true as const,
};
function fixture(
  complete: typeof chatCompletion = vi.fn(async () => ({
    text: 'Usulan',
    state: 'completed' as const,
    inputTokens: 10,
    outputTokens: 20,
  })),
  now = () => 1000,
) {
  const saved = new Map<string, string>();
  const store: LlmSecretStore = {
    read: async (c) => saved.get(secretScope(c)) ?? null,
    write: async (c, key) => {
      saved.set(secretScope(c), key);
    },
    remove: async (c) => {
      saved.delete(secretScope(c));
    },
  };
  return { session: new LlmSession(store, complete, now), complete };
}
async function idle(session: LlmSession) {
  for (let i = 0; i < 100; i++) {
    if (session.snapshot().activity === 'idle') return;
    await new Promise<void>((r) => setImmediate(r));
  }
  throw new Error('not idle');
}
async function ready(session: LlmSession, c: LlmConnection = connection) {
  session.act({ action: 'configure', connection: c });
  await idle(session);
  session.act({ action: 'save_key', key: 'fixture-secret' });
  await idle(session);
}
const prepare = { action: 'prepare' as const, text: 'Tinjau naskah.', maxTokens: 100, tariff };
describe('LLM request lifecycle', () => {
  it('requires key, confirmed tariff and one-use approval before exactly one POST', async () => {
    const { session, complete } = fixture();
    session.act({ action: 'configure', connection });
    await idle(session);
    expect(session.act(prepare).error).toBe('KEY_REQUIRED');
    expect(
      llmActionSchema.safeParse({ ...prepare, tariff: { ...tariff, checkedByUser: false } })
        .success,
    ).toBe(false);
    await ready(session);
    const quote = session.act(prepare).quote!;
    expect(complete).not.toHaveBeenCalled();
    session.act({ action: 'submit', approvalId: quote.id });
    await idle(session);
    expect(session.snapshot().reply?.text).toBe('Usulan');
    expect(session.snapshot().reply?.requestId).toBe(quote.id);
    expect(llmSnapshotSchema.safeParse(session.snapshot()).success).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(session.act({ action: 'submit', approvalId: quote.id }).error).toBe('INVALID_APPROVAL');
    expect(JSON.stringify(session.snapshot())).not.toContain('fixture-secret');
  });
  it('expires approvals and invalidates them when key or destination changes', async () => {
    let now = 1000;
    const { session, complete } = fixture(undefined, () => now);
    await ready(session);
    const quote = session.act(prepare).quote!;
    now = quote.expiresAt;
    expect(session.act({ action: 'submit', approvalId: quote.id }).error).toBe('INVALID_APPROVAL');
    const next = session.act(prepare).quote!;
    session.act({ action: 'save_key', key: 'replacement' });
    await idle(session);
    expect(session.act({ action: 'submit', approvalId: next.id }).error).toBe('INVALID_APPROVAL');
    session.act({
      action: 'configure',
      connection: { ...connection, baseUrl: 'https://another.example.com' },
    });
    await idle(session);
    expect(session.snapshot().keyPresent).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });
  it('does not replay an ambiguous request or expose exception messages', async () => {
    const complete = vi.fn(async () => {
      throw new Error('fixture-secret response dump');
    });
    const { session } = fixture(complete);
    await ready(session);
    session.act({ action: 'submit', approvalId: session.act(prepare).quote!.id });
    await idle(session);
    expect(session.snapshot().error).toBe('REQUEST_UNCERTAIN');
    expect(session.snapshot().quote).toBeNull();
    session.act({ action: 'inspect' });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(session.snapshot())).not.toContain('fixture-secret');
  });
  it('cancels waiting and refuses configuration changes while a request is active', async () => {
    const complete = vi.fn(
      async (
        _c: LlmConnection,
        _key: string | null,
        _text: string,
        _max: number,
        signal: AbortSignal,
      ) =>
        new Promise<never>((_, reject) =>
          signal.addEventListener('abort', () => reject(new LlmError('CANCELLED_UNCERTAIN')), {
            once: true,
          }),
        ),
    );
    const { session } = fixture(complete);
    await ready(session);
    session.act({ action: 'submit', approvalId: session.act(prepare).quote!.id });
    expect(session.act({ action: 'configure', connection }).error).toBe('BUSY');
    session.act({ action: 'cancel' });
    await idle(session);
    expect(session.snapshot().error).toBe('CANCELLED_UNCERTAIN');
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('rejects secret-bearing snapshots, privileged actions and unsupported protocols', () => {
    expect(
      llmSnapshotSchema.safeParse({ ...fixture().session.snapshot(), key: 'secret' }).success,
    ).toBe(false);
    expect(
      llmActionSchema.safeParse({
        action: 'submit',
        approvalId: crypto.randomUUID(),
        text: 'changed',
      }).success,
    ).toBe(false);
    expect(() =>
      llmConnection({ ...newProviderProfile('llm'), protocol: 'responses' }, 'max_tokens'),
    ).toThrow('UNSUPPORTED_PROTOCOL');
  });
});
