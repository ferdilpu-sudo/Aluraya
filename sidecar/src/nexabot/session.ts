import { randomUUID } from 'node:crypto';
import {
  nexaActionSchema,
  nexaSnapshotSchema,
  type NexaAction,
  type NexaSnapshot,
  type NexaJob,
} from '../../../src/contracts/nexabot';
import { NexaClient } from './client';
import { NexaStore } from './store';
import { NexaError, errorCode } from './errors';
import { monitorJob } from './monitor';

export class NexaSession {
  private key: string | null = null;
  private loaded = false;
  private controller = new AbortController();
  private running: Promise<void> | null = null;
  private state: NexaSnapshot = {
    schemaVersion: 1,
    configured: false,
    activity: 'loading',
    credit: null,
    quote: null,
    jobs: [],
    jobCount: 0,
    page: 0,
    activeId: null,
    error: null,
  };
  constructor(
    private readonly store: NexaStore,
    private readonly client = new NexaClient(),
    private readonly pollDelay = 3000,
  ) {
    this.start('loading', async () => {
      this.key = await store.open();
      this.loaded = true;
    });
  }
  snapshot(): NexaSnapshot {
    try {
      if (this.loaded) {
        this.state.jobs = this.store.list(this.state.page);
        this.state.jobCount = this.store.count();
        this.state.activeId = this.store.active();
      }
      this.state.configured = this.key !== null;
      return nexaSnapshotSchema.parse(this.state);
    } catch {
      return { ...this.state, jobs: [], error: 'STORAGE_ERROR' };
    }
  }
  act(raw: NexaAction): NexaSnapshot {
    const action = nexaActionSchema.parse(raw);
    if (action.action === 'inspect') return this.snapshot();
    if (action.action === 'history' && this.loaded) {
      this.state.page = action.page;
      return this.snapshot();
    }
    if (action.action === 'pause' && this.state.activity === 'monitoring') {
      this.controller.abort();
      this.controller = new AbortController();
      return this.snapshot();
    }
    if (this.running) return { ...this.snapshot(), error: 'BUSY' };
    if (!this.loaded) return { ...this.snapshot(), error: 'STORAGE_ERROR' };
    if (action.action === 'save_key' || action.action === 'remove_key') {
      this.state.quote = null;
      this.start('saving', async () => {
        const key = action.action === 'save_key' ? action.key : null;
        await this.store.saveKey(key);
        this.key = key;
        this.state.credit = null;
      });
    } else if (action.action === 'credit') {
      this.start('credit', async () => {
        this.state.credit = await this.client.credit(this.requireKey(), this.controller.signal);
      });
    } else if (action.action === 'prepare') {
      this.state.quote = null;
      this.start('preparing', async () => {
        if (this.store.active()) throw new NexaError('BUSY');
        const credit = await this.client.credit(this.requireKey(), this.controller.signal);
        this.state.credit = credit;
        if (credit.balance < credit.cost) throw new NexaError('INSUFFICIENT_CREDIT');
        this.state.quote = {
          id: randomUUID(),
          input: action.input,
          cost: credit.cost,
          expiresAt: Date.now() + 120000,
        };
      });
    } else if (action.action === 'submit') {
      const quote = this.state.quote;
      // Consume approval synchronously: double clicks cannot create a second job.
      this.state.quote = null;
      this.start('submitting', async () => {
        if (!quote || quote.id !== action.approvalId || Date.now() >= quote.expiresAt)
          throw new NexaError('APPROVAL_STALE');
        if (this.store.active()) throw new NexaError('BUSY');
        const key = this.requireKey();
        const credit = await this.client.credit(key, this.controller.signal);
        this.state.credit = credit;
        if (Date.now() >= quote.expiresAt) throw new NexaError('APPROVAL_STALE');
        if (credit.cost !== quote.cost) throw new NexaError('COST_CHANGED');
        if (credit.balance < quote.cost) throw new NexaError('INSUFFICIENT_CREDIT');
        let job: NexaJob = {
          id: randomUUID(),
          providerId: null,
          input: quote.input,
          cost: quote.cost,
          createdAt: Date.now(),
          chargedCost: null,
          state: 'submitting',
          error: null,
          media: null,
        };
        this.store.insert(job, key);
        this.state.page = 0;
        this.state.credit = null;
        try {
          const submitted = await this.client.submit(key, job.input, this.controller.signal);
          job = {
            ...job,
            providerId: submitted.id,
            chargedCost: submitted.chargedCost,
            state: 'queued',
          };
          this.store.update(job);
        } catch (error) {
          const code = errorCode(error);
          const certain = [
            'INVALID_REQUEST',
            'INVALID_KEY',
            'INSUFFICIENT_CREDIT',
            'ACCESS_DENIED',
            'NOT_FOUND',
            'RATE_LIMIT',
          ].includes(code);
          this.store.update({
            ...job,
            state: certain ? 'failed' : 'uncertain',
            error: certain ? code : 'SUBMIT_UNCERTAIN',
          });
          throw error;
        }
        this.state.activity = 'monitoring';
        await monitorJob(this.store, this.client, key, job, this.controller.signal, this.pollDelay);
      });
    } else if (action.action === 'resume') {
      this.start('monitoring', async () => {
        const key = this.requireKey();
        const job = this.store.get(action.id, key);
        if (job.state === 'ready' || job.state === 'failed') return;
        await monitorJob(this.store, this.client, key, job, this.controller.signal, this.pollDelay);
      });
    }
    return this.snapshot();
  }
  private requireKey() {
    if (!this.key) throw new NexaError('KEY_REQUIRED');
    return this.key;
  }
  private start(activity: NexaSnapshot['activity'], work: () => Promise<void>) {
    this.state.activity = activity;
    this.state.error = null;
    this.running = Promise.resolve()
      .then(work)
      .catch((error: unknown) => {
        this.state.error = errorCode(error);
      })
      .finally(() => {
        this.state.activity = 'idle';
        this.running = null;
      });
  }
  async close() {
    this.controller.abort();
    await this.running;
    this.key = null;
    this.store.close();
  }
}
