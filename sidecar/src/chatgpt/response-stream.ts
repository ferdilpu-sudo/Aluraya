import { ChatError, providerError } from './errors';
import { diagnostic } from './diagnostics';

// Inspect bounded body bytes: proxies can omit or rewrite Content-Type.
// A 200 response is never sufficient evidence that inference completed.
export async function openEventStream(response: Response): Promise<ReadableStream<Uint8Array>> {
  if (!response.body)
    throw new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol', 'empty'));
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let transferred = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        size += value.byteLength;
        if (size > 1048576)
          throw new ChatError('OUTPUT_LIMIT', diagnostic(response, null, 'protocol'));
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks);
      const prefix = bytes
        .toString('utf8')
        .replace(/^\uFEFF/, '')
        .trimStart();
      if (prefix.startsWith('{') || prefix.startsWith('[')) {
        // Even HTTP 200 can contain an error envelope. Never treat JSON output
        // as successful streaming inference or expose its raw message/body.
        while (!done) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.byteLength;
          if (size > 1048576)
            throw new ChatError('OUTPUT_LIMIT', diagnostic(response, null, 'protocol'));
          chunks.push(next.value);
        }
        let body: unknown;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
          throw new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol', 'non_json'));
        }
        throw providerError(response.status, body, diagnostic(response, body, 'protocol'));
      }
      if (/^(?:data:|event:|id:|retry:|:)/.test(prefix)) {
        transferred = true;
        return new ReadableStream<Uint8Array>({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
          },
          async pull(controller) {
            try {
              const next = await reader.read();
              if (next.done) {
                reader.releaseLock();
                controller.close();
              } else controller.enqueue(next.value);
            } catch (error) {
              controller.error(error);
            }
          },
          async cancel() {
            await reader.cancel().catch(() => {});
          },
        });
      }
      if (done || prefix.startsWith('<') || prefix.includes('\n') || size > 4096)
        throw new ChatError(
          'PROVIDER_ERROR',
          diagnostic(response, null, 'protocol', size ? 'non_json' : 'empty'),
        );
    }
  } finally {
    if (!transferred) await reader.cancel().catch(() => {});
  }
}
