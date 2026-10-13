import { describe, expect, it, vi } from 'vitest';
import { ChatSession } from '../sidecar/src/chatgpt/session';
import { ChatError } from '../sidecar/src/chatgpt/errors';
import type { Account, CredentialStore, SavedState } from '../sidecar/src/chatgpt/store';
import type { Message } from '../sidecar/src/chatgpt/inference';

const id = '38d0587b-17b4-4abc-a6c2-c23aabdaae8d';
function setup(scopes = ['chatgpt.tokens.use.direct']) {
  const account: Account = {
    id,
    clientId: 'oaiapp_fixture',
    subject: 'subject',
    email: 'test@example.com',
    welcomeSeen: false,
    credentials: {
      accessToken: 'fixture-access-secret',
      refreshToken: 'fixture-refresh-secret',
      idToken: 'fixture-id-secret',
      scopes,
      expiresAt: Date.now() + 3600000,
    },
  };
  const saved: SavedState = {
    schemaVersion: 1,
    hostId: 'urn:uuid:fixture',
    activeId: id,
    accounts: [account],
  };
  const store: CredentialStore = {
    load: async () => saved,
    save: vi.fn(async () => {}),
    close: async () => {},
  };
  const deps = {
    authorize: vi.fn(async () => ({
      code: 'fixture-code',
      clientId: 'oaiapp_fixture',
      verifier: 'verifier',
      nonce: 'nonce',
      redirectUri: 'http://127.0.0.1:1455/auth/callback',
    })),
    exchange: vi.fn(async () => ({
      credentials: account.credentials!,
      subject: 'subject',
      email: 'test@example.com',
    })),
    renew: vi.fn(async () => ({ ...account.credentials!, accessToken: 'renewed' })),
    revoke: vi.fn(async () => true),
    listModels: vi.fn(async () => [{ id: 'account-model', name: 'Account model' }]),
    streamReply: vi.fn(
      async (
        _token: string,
        _model: string,
        _input: Message[],
        _signal: AbortSignal,
        delta: (text: string) => void,
      ) => {
        delta('Jawaban.');
      },
    ),
    openProviderPage: vi.fn(async () => {}),
  };
  return { account, saved, store, deps, session: new ChatSession(store, deps) };
}
async function idle(session: ChatSession) {
  await vi.waitFor(() => expect(session.snapshot().activity).toBe('idle'));
}
async function ready(session: ChatSession) {
  await idle(session);
  session.act({ action: 'models' });
  await idle(session);
  session.act({ action: 'confirm_plan' });
  await idle(session);
}
describe('ChatGPT session gates', () => {
  it('never exports credentials and requires explicit confirmation before send', async () => {
    const { session, deps } = setup();
    await idle(session);
    expect(JSON.stringify(session.snapshot())).not.toContain('secret');
    expect(session.act({ action: 'send', model: 'account-model', text: 'Hi' }).error).toBe(
      'PLAN_CONFIRMATION_REQUIRED',
    );
    expect(deps.streamReply).not.toHaveBeenCalled();
    await session.close();
  });
  it('blocks identity-only accounts before model discovery or inference', async () => {
    const { session, deps } = setup(['openid']);
    await idle(session);
    session.act({ action: 'models' });
    await idle(session);
    expect(session.snapshot().error).toBe('PLAN_PERMISSION_REQUIRED');
    expect(deps.listModels).not.toHaveBeenCalled();
    await session.close();
  });
  it('uses account-specific model and preserves successful conversation history', async () => {
    const { session, deps } = setup();
    await ready(session);
    expect(session.act({ action: 'send', model: 'invented', text: 'Hi' }).error).toBe(
      'INVALID_MODEL',
    );
    session.act({ action: 'send', model: 'account-model', text: 'Satu' });
    await idle(session);
    session.act({ action: 'send', model: 'account-model', text: 'Dua' });
    await idle(session);
    expect(deps.streamReply.mock.calls[1]?.[2]).toEqual([
      { role: 'user', content: 'Satu' },
      { role: 'assistant', content: 'Jawaban.' },
      { role: 'user', content: 'Dua' },
    ]);
    expect(session.snapshot().reply?.state).toBe('completed');
    await session.close();
  });
  it('pauses quota failure without retry, paid fallback or deleting credentials', async () => {
    const { session, deps, account } = setup();
    await ready(session);
    deps.streamReply.mockRejectedValue(new ChatError('USAGE_LIMIT'));
    session.act({ action: 'send', model: 'account-model', text: 'Hi' });
    await idle(session);
    expect(session.snapshot().usagePaused).toBe(true);
    expect(session.act({ action: 'send', model: 'account-model', text: 'Again' }).error).toBe(
      'USAGE_LIMIT',
    );
    expect(deps.streamReply).toHaveBeenCalledTimes(1);
    expect(account.credentials).not.toBeNull();
    await session.close();
  });
  it('does not replace the selected account after a returning identity mismatch', async () => {
    const { session, deps, saved, account } = setup();
    await idle(session);
    deps.exchange.mockResolvedValue({ ...(await deps.exchange()), subject: 'other' });
    session.act({ action: 'login', addAccount: false });
    await idle(session);
    expect(session.snapshot().error).toBe('INVALID_IDENTITY');
    expect(saved.accounts[0]).toBe(account);
    await session.close();
  });
  it('revokes before clearing local tokens and retains the issued registration', async () => {
    const { session, deps, account } = setup();
    await idle(session);
    deps.revoke.mockResolvedValue(false);
    session.act({ action: 'logout' });
    await idle(session);
    expect(session.snapshot().error).toBe('REVOCATION_UNCONFIRMED');
    expect(account.credentials).toBeNull();
    expect(account.clientId).toBe('oaiapp_fixture');
    await session.close();
  });
  it('serializes work while refreshing and persists replacement before discovery', async () => {
    const { session, deps, account, store } = setup();
    account.credentials!.expiresAt = 0;
    await idle(session);
    session.act({ action: 'models' });
    expect(session.act({ action: 'login', addAccount: true }).error).toBe('BUSY');
    await idle(session);
    expect(deps.renew).toHaveBeenCalledTimes(1);
    expect(store.save).toHaveBeenCalled();
    expect(deps.listModels.mock.calls.length).toBe(1);
    await session.close();
  });
});

it('cancels a partial reply, rejects concurrent sends and excludes failed history', async () => {
  const { session, deps } = setup();
  await ready(session);
  deps.streamReply.mockImplementationOnce(async (_token, _model, _input, signal, delta) => {
    delta('Parsial');
    await new Promise<void>((_resolve, reject) => {
      if (signal.aborted) reject(new Error('aborted'));
      else signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    });
  });
  session.act({ action: 'send', model: 'account-model', text: 'Dibatalkan' });
  await vi.waitFor(() => expect(session.snapshot().reply?.text).toBe('Parsial'));
  expect(session.act({ action: 'send', model: 'account-model', text: 'Ganda' }).error).toBe('BUSY');
  session.act({ action: 'cancel' });
  await idle(session);
  expect(session.snapshot().reply?.state).toBe('cancelled');
  session.act({ action: 'send', model: 'account-model', text: 'Baru' });
  await idle(session);
  expect(deps.streamReply.mock.calls[1]?.[2]).toEqual([{ role: 'user', content: 'Baru' }]);
  await session.close();
});

it('exposes safe failure diagnostics until the next operation and preserves account credentials', async () => {
  const { session, deps, account } = setup();
  await ready(session);
  const diagnostic = {
    stage: 'http' as const,
    status: 400,
    shape: 'error' as const,
    code: 'invalid_request_error',
    param: 'input',
    requestId: 'req_fixture',
  };
  deps.streamReply.mockRejectedValueOnce(new ChatError('PROVIDER_ERROR', diagnostic));
  session.act({ action: 'send', model: 'account-model', text: 'tes' });
  await idle(session);
  expect(session.snapshot()).toMatchObject({ diagnostic, reply: { state: 'failed', text: '' } });
  expect(JSON.stringify(session.snapshot())).not.toContain('secret');
  expect(account.credentials).not.toBeNull();
  expect(deps.streamReply).toHaveBeenCalledTimes(1);
  session.act({ action: 'clear' });
  expect(session.snapshot().diagnostic).toBeNull();
  await session.close();
});
