import { z } from 'zod';
import { ChatError, providerError } from './errors';
import { diagnostic } from './diagnostics';
import { requestJson, readJson, RESOURCE } from './http';

export type Message = { role: 'user' | 'assistant'; content: string };
export async function listModels(token: string, signal: AbortSignal) {
  const result = z
    .object({
      models: z.array(
        z.object({
          slug: z.string().min(1).max(200),
          display_name: z.string().min(1).max(200),
          visibility: z.string(),
        }),
      ),
    })
    .safeParse(
      await requestJson(`${RESOURCE}/models`, {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  if (!result.success) throw new ChatError('PROVIDER_ERROR');
  const visible = result.data.models.filter((model) => model.visibility === 'list');
  if (visible.length > 100) throw new ChatError('PROVIDER_ERROR');
  const models = visible.map((model) => ({ id: model.slug, name: model.display_name }));
  if (Buffer.byteLength(JSON.stringify(models)) > 16000) throw new ChatError('PROVIDER_ERROR');
  return models;
}

export async function consumeStream(
  response: Response,
  onDelta: (delta: string) => void,
): Promise<void> {
  if (!response.ok) {
    await readJson(response);
    return;
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))
    throw new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol'));
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffer = '',
    total = 0,
    completed = false,
    output = 0,
    encodedOutput = 0;
  try {
    while (!completed) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > 8 * 1048576) throw new ChatError('OUTPUT_LIMIT');
      buffer += decoder.decode(chunk.value, { stream: true });
      // Preserve a CR split across chunks; normalize only complete SSE blocks.
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = block
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).replace(/^ /, ''))
          .join('\n');
        if (!data || data === '[DONE]') continue;
        const event = JSON.parse(data) as {
          type?: string;
          delta?: unknown;
          response?: { error?: { code?: string; param?: string }; status?: string };
          error?: { code?: string; param?: string };
          code?: string;
          param?: string;
        };
        if (
          event.type === 'response.output_text.delta' ||
          event.type === 'response.refusal.delta'
        ) {
          if (typeof event.delta !== 'string') throw new ChatError('PROVIDER_ERROR');
          output += event.delta.length;
          encodedOutput += Buffer.byteLength(JSON.stringify(event.delta));
          if (output > 6000 || encodedOutput > 24000) throw new ChatError('OUTPUT_LIMIT');
          onDelta(event.delta);
        } else if (event.type === 'response.failed' || event.type === 'error') {
          const error = event.response?.error ??
            event.error ?? { code: event.code, param: event.param };
          throw providerError(
            response.status,
            { error },
            diagnostic(response, { error }, 'stream', 'event'),
          );
        } else if (event.type === 'response.incomplete') throw new ChatError('RESPONSE_INCOMPLETE');
        else if (event.type === 'response.completed') {
          completed = true;
          break;
        }
      }
      if (buffer.length > 1048576) throw new ChatError('OUTPUT_LIMIT');
    }
    if (!completed) throw new ChatError('STREAM_INTERRUPTED');
  } catch (error) {
    if (error instanceof ChatError) {
      error.diagnostic ??= diagnostic(response, null, 'stream', 'event');
      throw error;
    }
    if (error instanceof SyntaxError)
      throw new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol', 'event'));
    if (error instanceof TypeError)
      throw new ChatError('NETWORK_ERROR', diagnostic(response, null, 'stream', 'event'));
    throw error;
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export async function streamReply(
  token: string,
  model: string,
  input: Message[],
  signal: AbortSignal,
  onDelta: (delta: string) => void,
) {
  const response = await fetch(`${RESOURCE}/responses`, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.any([signal, AbortSignal.timeout(180000)]),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input,
      instructions:
        'Anda adalah copilot Aluraya Studio. Bantu pengguna mengembangkan cerita dalam bahasa Indonesia. Anda belum memiliki tool produksi. Jangan mengklaim menjalankan generasi, menyimpan proyek, atau menyetujui biaya.',
      store: false,
      stream: true,
    }),
  });
  await consumeStream(response, onDelta);
}
