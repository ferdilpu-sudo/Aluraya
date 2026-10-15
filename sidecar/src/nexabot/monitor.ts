import { setTimeout } from 'node:timers/promises';
import type { NexaJob } from '../../../src/contracts/nexabot';
import { NexaClient } from './client';
import { NexaStore } from './store';
import { collectMedia } from './media';
import { errorCode, NexaError } from './errors';

export async function monitorJob(
  store: NexaStore,
  client: NexaClient,
  key: string,
  job: NexaJob,
  signal: AbortSignal,
  delay = 3000,
) {
  if (!job.providerId) throw new NexaError('SUBMIT_UNCERTAIN');
  const providerId = job.providerId;
  const deadline = Date.now() + 30 * 60000;
  try {
    while (!signal.aborted && Date.now() < deadline) {
      const status = await client.status(key, providerId, signal);
      job = { ...job, state: status, error: status === 'failed' ? 'JOB_FAILED' : null };
      store.update(job);
      if (status === 'failed') return;
      if (status === 'done') {
        const response = await client.download(key, providerId, signal);
        const media = await collectMedia(response, store.directory, job.input.mode);
        store.update({ ...job, state: 'ready', media, error: null });
        return;
      }
      await setTimeout(delay, undefined, { signal });
    }
    throw new NexaError('NETWORK_ERROR');
  } catch (error) {
    store.update({ ...job, error: signal.aborted ? null : errorCode(error) });
    if (signal.aborted) return;
    throw error;
  }
}
