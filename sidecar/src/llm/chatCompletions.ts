import { z } from 'zod';
import {
  llmConnectionSchema,
  type LlmConnection,
  type LlmErrorCode,
  type LlmSnapshot,
} from '../../../src/contracts/llm';
export class LlmError extends Error {
  constructor(readonly code: LlmErrorCode) {
    super(code);
  }
}
const resultSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.enum(['stop', 'length']),
        message: z.object({
          content: z.string().min(1).max(6000),
          tool_calls: z.array(z.unknown()).max(0).optional(),
          function_call: z.null().optional(),
        }),
      }),
    )
    .length(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative(),
      completion_tokens: z.number().int().nonnegative(),
    })
    .optional(),
});
export function requestUrl(c: LlmConnection) {
  llmConnectionSchema.parse(c);
  const base = new URL(c.baseUrl);
  const url = new URL(base.origin + base.pathname.replace(/\/$/, '') + c.endpoint);
  if (url.origin !== base.origin || url.search || url.hash) throw new LlmError('CONFIG_REQUIRED');
  return url.href;
}
export async function chatCompletion(
  c: LlmConnection,
  key: string | null,
  text: string,
  maxTokens: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<NonNullable<LlmSnapshot['reply']>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (c.auth.type !== 'none') {
    if (!key) throw new LlmError('KEY_REQUIRED');
    if (c.auth.type === 'bearer') headers.Authorization = `Bearer ${key}`;
    else headers[c.auth.headerName] = key;
  }
  const combined = AbortSignal.any([signal, AbortSignal.timeout(c.timeoutSeconds * 1000)]);
  let response: Response;
  try {
    response = await fetcher(requestUrl(c), {
      method: 'POST',
      headers,
      redirect: 'error',
      signal: combined,
      body: JSON.stringify({
        model: c.model,
        messages: [{ role: 'user', content: text }],
        stream: false,
        [c.tokenLimitField]: maxTokens,
      }),
    });
  } catch {
    throw new LlmError(signal.aborted ? 'CANCELLED_UNCERTAIN' : 'REQUEST_UNCERTAIN');
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new LlmError(
      response.status === 401 || response.status === 403
        ? 'AUTH_REJECTED'
        : response.status === 429
          ? 'RATE_LIMIT'
          : response.status >= 500
            ? 'REQUEST_UNCERTAIN'
            : 'PROVIDER_ERROR',
    );
  }
  if (
    !response.headers.get('content-type')?.toLowerCase().includes('application/json') ||
    !response.body
  ) {
    await response.body?.cancel().catch(() => {});
    throw new LlmError('INVALID_RESPONSE');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1048576) throw new LlmError('OUTPUT_LIMIT');
      chunks.push(value);
    }
    const parsed = resultSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!parsed.success) throw new LlmError('INVALID_RESPONSE');
    const choice = parsed.data.choices[0]!;
    const output = key
      ? choice.message.content.split(key).join('[REDACTED]')
      : choice.message.content;
    if (output.length > 6000) throw new LlmError('OUTPUT_LIMIT');
    return {
      text: output,
      state: choice.finish_reason === 'stop' ? 'completed' : 'incomplete',
      inputTokens: parsed.data.usage?.prompt_tokens ?? null,
      outputTokens: parsed.data.usage?.completion_tokens ?? null,
    };
  } catch (error) {
    if (error instanceof LlmError) throw error;
    throw new LlmError(
      combined.aborted
        ? signal.aborted
          ? 'CANCELLED_UNCERTAIN'
          : 'REQUEST_UNCERTAIN'
        : 'INVALID_RESPONSE',
    );
  } finally {
    await reader.cancel().catch(() => {});
  }
}
