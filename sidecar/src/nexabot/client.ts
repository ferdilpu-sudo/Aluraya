import { z } from 'zod';
import { type GenerationInput } from '../../../src/contracts/nexabot';
import { NexaError, httpError } from './errors';

export const ORIGIN = 'https://nexabot.id';
const providerId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export class NexaClient {
  constructor(private readonly request: typeof fetch = fetch) {}
  async json(path: string, key: string, signal: AbortSignal, input?: GenerationInput) {
    let response: Response;
    try {
      response = await this.request(`${ORIGIN}${path}`, {
        method: input ? 'POST' : 'GET',
        redirect: 'error',
        headers: {
          'x-api-key': key,
          Accept: 'application/json',
          ...(input ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(input ? { body: JSON.stringify(input) } : {}),
        signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
      });
    } catch {
      throw new NexaError(input ? 'SUBMIT_UNCERTAIN' : 'NETWORK_ERROR');
    }
    if (!response.ok) {
      await response.body?.cancel();
      // Only explicit rejection statuses prove that a submit was not accepted.
      if (input && ![400, 401, 402, 403, 404, 429].includes(response.status))
        throw new NexaError('SUBMIT_UNCERTAIN');
      throw httpError(response.status);
    }
    try {
      if (input && response.status !== 202) throw new Error('STATUS');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('EMPTY');
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const item = await reader.read();
          if (item.done) break;
          size += item.value.length;
          if (size > 65536) throw new Error('SIZE');
          chunks.push(item.value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    } catch {
      throw new NexaError(input ? 'SUBMIT_UNCERTAIN' : 'PROTOCOL_ERROR');
    }
  }
  async credit(key: string, signal: AbortSignal) {
    const raw = await this.json('/api/v1/api/credit', key, signal);
    const parsed = z
      .object({
        ok: z.literal(true),
        registered: z.literal(true),
        credit: z.number().finite().nonnegative(),
        credit_cost: z.number().finite().positive(),
      })
      .safeParse(raw);
    if (!parsed.success) throw new NexaError('PROTOCOL_ERROR');
    return { balance: parsed.data.credit, cost: parsed.data.credit_cost, checkedAt: Date.now() };
  }
  async submit(key: string, input: GenerationInput, signal: AbortSignal) {
    const raw = await this.json('/api/v1/api', key, signal, input);
    const parsed = z
      .object({ ok: z.literal(true), job_id: providerId, status: z.literal('queued') })
      .safeParse(raw);
    if (!parsed.success) throw new NexaError('SUBMIT_UNCERTAIN');
    const billing = z.object({ credit_cost: z.number().finite().nonnegative() }).safeParse(raw);
    return {
      id: parsed.data.job_id,
      chargedCost: billing.success ? billing.data.credit_cost : null,
    };
  }
  async status(key: string, id: string, signal: AbortSignal) {
    providerId.parse(id);
    const raw = await this.json(`/api/v1/jobs/${id}`, key, signal);
    const parsed = z
      .object({
        ok: z.literal(true),
        job: z.object({
          id: z.literal(id),
          status: z.enum(['queued', 'processing', 'done', 'failed']),
        }),
      })
      .safeParse(raw);
    if (!parsed.success) throw new NexaError('PROTOCOL_ERROR');
    // Never relay progress/error text: documentation includes provider account email here.
    return parsed.data.job.status;
  }
  async download(key: string, id: string, signal: AbortSignal): Promise<Response> {
    providerId.parse(id);
    let url = new URL(`/api/v1/jobs/${id}/download`, ORIGIN);
    for (let count = 0; count < 4; count++) {
      let response: Response;
      try {
        response = await this.request(url, {
          headers: { 'x-api-key': key },
          redirect: 'manual',
          signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
        });
      } catch {
        throw new NexaError('DOWNLOAD_FAILED');
      }
      if (response.status >= 300 && response.status < 400) {
        const next = response.headers.get('location');
        await response.body?.cancel();
        if (!next) throw new NexaError('DOWNLOAD_REDIRECT');
        const target = new URL(next, url);
        if (target.origin !== ORIGIN || target.username || target.password)
          throw new NexaError('DOWNLOAD_REDIRECT');
        url = target;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw httpError(response.status);
      }
      return response;
    }
    throw new NexaError('DOWNLOAD_REDIRECT');
  }
}
