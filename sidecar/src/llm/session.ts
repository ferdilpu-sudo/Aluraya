import { randomUUID } from 'node:crypto';
import {
  emptyLlmSnapshot,
  llmActionSchema,
  llmSnapshotSchema,
  type LlmAction,
  type LlmSnapshot,
} from '../../../src/contracts/llm';
import type { LlmSecretStore } from './secretStore';
import { chatCompletion, LlmError } from './chatCompletions';
export class LlmSession {
  private state: LlmSnapshot = structuredClone(emptyLlmSnapshot);
  private key: string | null = null;
  private controller: AbortController | null = null;
  private task: Promise<void> | null = null;
  constructor(
    private readonly store: LlmSecretStore,
    private readonly complete = chatCompletion,
    private readonly now = Date.now,
  ) {}
  snapshot() {
    return llmSnapshotSchema.parse(structuredClone(this.state));
  }
  act(input: LlmAction) {
    const action = llmActionSchema.parse(input);
    if (action.action === 'inspect') return this.snapshot();
    if (action.action === 'cancel') {
      this.state.quote = null;
      this.controller?.abort();
      return this.snapshot();
    }
    if (this.state.activity !== 'idle') return { ...this.snapshot(), error: 'BUSY' as const };
    this.state.error = null;
    if (action.action === 'configure') {
      this.state = { ...structuredClone(emptyLlmSnapshot), connection: action.connection };
      this.key = null;
      this.run('storage', async () => {
        this.key =
          action.connection.auth.type === 'none' ? null : await this.store.read(action.connection);
        this.state.keyPresent = Boolean(this.key);
      });
    } else if (!this.state.connection) this.state.error = 'CONFIG_REQUIRED';
    else if (action.action === 'save_key' || action.action === 'remove_key') {
      this.state.quote = null;
      const connection = this.state.connection;
      this.run('storage', async () => {
        if (action.action === 'save_key') {
          if (connection.auth.type === 'none') throw new LlmError('CONFIG_REQUIRED');
          await this.store.write(connection, action.key);
          this.key = action.key;
        } else {
          await this.store.remove(connection);
          this.key = null;
        }
        this.state.keyPresent = Boolean(this.key);
      });
    } else if (action.action === 'prepare') {
      this.state.reply = null;
      this.state.quote = null;
      if (this.state.connection.auth.type !== 'none' && !this.key)
        this.state.error = 'KEY_REQUIRED';
      else
        this.state.quote = {
          id: randomUUID(),
          expiresAt: this.now() + 120000,
          text: action.text,
          maxTokens: action.maxTokens,
          tariff: action.tariff,
        };
    } else if (action.action === 'submit') {
      const quote = this.state.quote;
      this.state.quote = null;
      if (!quote || quote.id !== action.approvalId || quote.expiresAt <= this.now())
        this.state.error = 'INVALID_APPROVAL';
      else {
        this.state.reply = null;
        this.controller = new AbortController();
        const controller = this.controller;
        const connection = this.state.connection;
        this.run('request', async () => {
          const result = await this.complete(
            connection,
            this.key,
            quote.text,
            quote.maxTokens,
            controller.signal,
          );
          this.state.reply = { ...result, requestId: quote.id };
        });
      }
    }
    return this.snapshot();
  }
  private run(activity: 'storage' | 'request', work: () => Promise<void>) {
    this.state.activity = activity;
    this.task = work()
      .catch((error) => {
        this.state.error =
          error instanceof LlmError
            ? error.code
            : activity === 'storage'
              ? 'STORAGE_ERROR'
              : 'REQUEST_UNCERTAIN';
      })
      .finally(() => {
        this.state.activity = 'idle';
        this.controller = null;
        this.task = null;
      });
  }
  async close() {
    this.controller?.abort();
    await this.task;
    this.key = null;
    this.state.quote = null;
  }
}
