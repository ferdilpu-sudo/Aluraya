import { randomUUID } from 'node:crypto';
import {
  chatSnapshotSchema,
  type ChatAction,
  type ChatSnapshot,
} from '../../../src/contracts/chat';
import { ChatError, safeError } from './errors';
import { authorize } from './oauth';
import { exchange, renew, revoke } from './tokens';
import { listModels, streamReply, type Message } from './inference';
import { openProviderPage } from './windows';
import type { Account, CredentialStore, SavedState } from './store';

const defaults = { authorize, exchange, renew, revoke, listModels, streamReply, openProviderPage };
export class ChatSession {
  private saved: SavedState | null = null;
  private state: ChatSnapshot = {
    schemaVersion: 1,
    activity: 'loading',
    accountId: null,
    email: null,
    signedIn: false,
    planEnabled: false,
    planConfirmed: false,
    welcomePending: false,
    usagePaused: false,
    accounts: [],
    accountCount: 0,
    accountPage: 0,
    models: [],
    reply: null,
    error: null,
  };
  private history: Message[] = [];
  private abort: AbortController | null = null;
  private running: Promise<void> = Promise.resolve();
  private closed = false;
  constructor(
    private readonly store: CredentialStore,
    private readonly deps = defaults,
  ) {
    this.running = store
      .load()
      .then((state) => {
        this.saved = state;
      })
      .catch((error) => {
        this.state.error = safeError(error);
      })
      .finally(() => {
        this.state.activity = 'idle';
      });
  }
  private account(): Account | undefined {
    return this.saved?.accounts.find((account) => account.id === this.saved?.activeId);
  }
  snapshot(): ChatSnapshot {
    const active = this.account();
    return chatSnapshotSchema.parse({
      ...this.state,
      accountId: active?.id ?? null,
      email: active?.email ?? null,
      signedIn: Boolean(active?.credentials),
      planEnabled: active?.credentials?.scopes.includes('chatgpt.tokens.use.direct') ?? false,
      welcomePending: Boolean(active?.credentials && !active.welcomeSeen),
      accounts:
        this.saved?.accounts
          .slice(this.state.accountPage * 10, this.state.accountPage * 10 + 10)
          .map((account, index) => ({
            id: account.id,
            label: `${account.email?.slice(0, 120) ?? 'Akun ChatGPT'} · ${this.state.accountPage * 10 + index + 1}`,
          })) ?? [],
      accountCount: this.saved?.accounts.length ?? 0,
    });
  }
  private resetConversation() {
    this.history = [];
    this.state.reply = null;
    this.state.models = [];
    this.state.planConfirmed = false;
    this.state.usagePaused = false;
  }
  private launch(activity: ChatSnapshot['activity'], work: (signal: AbortSignal) => Promise<void>) {
    this.state.activity = activity;
    this.state.error = null;
    const abort = new AbortController();
    this.abort = abort;
    this.running = work(abort.signal)
      .catch(async (error) => {
        this.state.error = abort.signal.aborted ? 'LOGIN_CANCELLED' : safeError(error);
        if (this.state.reply?.state === 'streaming')
          this.state.reply.state = abort.signal.aborted ? 'cancelled' : 'failed';
        if (this.state.error === 'USAGE_LIMIT') this.state.usagePaused = true;
      })
      .finally(() => {
        this.state.activity = 'idle';
        this.abort = null;
      });
  }
  private async access(signal: AbortSignal): Promise<string> {
    const account = this.account();
    if (!account?.credentials || !this.saved) throw new ChatError('LOGIN_REQUIRED');
    if (account.credentials.expiresAt < Date.now() + 60000) {
      try {
        account.credentials = await this.deps.renew(account, new AbortController().signal);
      } catch (error) {
        if (error instanceof ChatError && error.code === 'LOGIN_REQUIRED') {
          account.credentials = null;
          this.state.models = [];
          await this.store.save(this.saved);
        }
        throw error;
      }
    }
    // Persist rotating credentials before any further request, including after a failed write.
    await this.store.save(this.saved);
    signal.throwIfAborted();
    if (!account.credentials.scopes.includes('chatgpt.tokens.use.direct'))
      throw new ChatError('PLAN_PERMISSION_REQUIRED');
    return account.credentials.accessToken;
  }
  private async models(signal: AbortSignal) {
    this.state.models = await this.deps.listModels(await this.access(signal), signal);
    this.state.usagePaused = false;
  }
  act(action: ChatAction): ChatSnapshot {
    if (this.closed) throw new ChatError('LOGIN_REQUIRED');
    if (action.action === 'inspect') return this.snapshot();
    if (action.action === 'cancel') {
      this.abort?.abort();
      return this.snapshot();
    }
    if (this.state.activity !== 'idle') return { ...this.snapshot(), error: 'BUSY' };
    if (!this.saved) return this.snapshot();
    switch (action.action) {
      case 'usage':
        this.launch('loading', () =>
          this.deps.openProviderPage('https://chatgpt.com/settings/usage'),
        );
        break;
      case 'accounts':
        this.state.accountPage = Math.min(
          action.page,
          Math.max(0, Math.ceil(this.saved.accounts.length / 10) - 1),
        );
        break;
      case 'select': {
        if (!this.saved.accounts.some((account) => account.id === action.accountId))
          return { ...this.snapshot(), error: 'LOGIN_REQUIRED' };
        this.saved.activeId = action.accountId;
        this.resetConversation();
        this.launch('loading', async () => {
          await this.store.save(this.saved!);
        });
        break;
      }
      case 'login':
        this.launch('login', async (signal) => {
          const existing = action.addAccount ? undefined : this.account();
          const auth = await this.deps.authorize(
            this.saved!.hostId,
            existing,
            this.deps.openProviderPage,
            signal,
          );
          const result = await this.deps.exchange(auth, signal);
          signal.throwIfAborted();
          if (existing && result.subject !== existing.subject)
            throw new ChatError('INVALID_IDENTITY');
          const registration = this.saved!.accounts.find((item) => item.clientId === auth.clientId);
          if (registration && registration.subject !== result.subject)
            throw new ChatError('INVALID_IDENTITY');
          const retained = existing ?? registration;
          const account: Account = {
            id: retained?.id ?? randomUUID(),
            clientId: auth.clientId,
            subject: result.subject,
            email: result.email,
            credentials: result.credentials,
            welcomeSeen: retained?.welcomeSeen ?? false,
          };
          const next: SavedState = {
            ...this.saved!,
            activeId: account.id,
            accounts: [...this.saved!.accounts.filter((item) => item.id !== account.id), account],
          };
          await this.store.save(next);
          const sameAccount = this.saved?.activeId === account.id;
          this.saved = next;
          if (!sameAccount) this.resetConversation();
          else {
            this.state.models = [];
            this.state.planConfirmed = false;
            this.state.usagePaused = false;
          }
          if (account.credentials?.scopes.includes('chatgpt.tokens.use.direct'))
            await this.models(signal);
          else throw new ChatError('PLAN_PERMISSION_REQUIRED');
        });
        break;
      case 'confirm_plan':
        this.launch('loading', async () => {
          const account = this.account();
          if (!account?.credentials?.scopes.includes('chatgpt.tokens.use.direct'))
            throw new ChatError('PLAN_PERMISSION_REQUIRED');
          account.welcomeSeen = true;
          await this.store.save(this.saved!);
          this.state.planConfirmed = true;
        });
        break;
      case 'models':
        this.launch('models', (signal) => this.models(signal));
        break;
      case 'clear':
        this.history = [];
        this.state.reply = null;
        this.state.error = null;
        break;
      case 'logout':
        this.launch('logout', async () => {
          const account = this.account();
          if (!account) return;
          const revoked = await this.deps.revoke(account);
          account.credentials = null;
          this.resetConversation();
          await this.store.save(this.saved!);
          if (!revoked) throw new ChatError('REVOCATION_UNCONFIRMED');
        });
        break;
      case 'send': {
        if (!this.state.planConfirmed)
          return { ...this.snapshot(), error: 'PLAN_CONFIRMATION_REQUIRED' };
        if (this.state.usagePaused) return { ...this.snapshot(), error: 'USAGE_LIMIT' };
        if (!this.state.models.some((model) => model.id === action.model))
          return { ...this.snapshot(), error: 'INVALID_MODEL' };
        if (
          this.history.reduce((size, message) => size + message.content.length, 0) +
            action.text.length >
          24000
        )
          return { ...this.snapshot(), error: 'CONTEXT_LIMIT' };
        const input: Message[] = [...this.history, { role: 'user', content: action.text }];
        const reply: NonNullable<ChatSnapshot['reply']> = {
          id: randomUUID(),
          text: '',
          state: 'streaming',
        };
        this.state.reply = reply;
        this.launch('reply', async (signal) => {
          await this.deps.streamReply(
            await this.access(signal),
            action.model,
            input,
            signal,
            (delta) => {
              reply.text += delta;
            },
          );
          signal.throwIfAborted();
          reply.state = 'completed';
          this.history = [...input, { role: 'assistant', content: reply.text }];
        });
        break;
      }
    }
    return this.snapshot();
  }
  async close() {
    this.closed = true;
    this.abort?.abort();
    await this.running;
    await this.store.close();
  }
}
