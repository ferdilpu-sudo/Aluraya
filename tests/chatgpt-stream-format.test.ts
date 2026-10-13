import { expect, it, vi } from 'vitest';
import { consumeStream } from '../sidecar/src/chatgpt/inference';

const streamText =
  'data: {"type":"response.output_text.delta","delta":"Halo"}\n\ndata: {"type":"response.completed"}\n\n';

it.each([null, 'text/plain; charset=utf-8', 'application/octet-stream', 'Text/Event-Stream'])(
  'reads valid SSE with Content-Type %s and requires completion',
  async (type) => {
    const response = new Response(new TextEncoder().encode(streamText), {
      headers: type ? { 'Content-Type': type } : {},
    });
    const delta = vi.fn();
    await consumeStream(response, delta);
    expect(delta).toHaveBeenCalledWith('Halo');
    expect(delta).toHaveBeenCalledTimes(1);
  },
);

it('recognizes fragmented SSE prefixes and cancels the source after completion', async () => {
  const cancel = vi.fn();
  const parts = [': heartbeat\r\n\r\n', ...streamText.match(/.{1,3}|\n/g)!];
  const response = new Response(
    new ReadableStream({
      pull(controller) {
        const part = parts.shift();
        if (part) controller.enqueue(new TextEncoder().encode(part));
      },
      cancel,
    }),
  );
  const delta = vi.fn();
  await consumeStream(response, delta);
  expect(delta).toHaveBeenCalledWith('Halo');
  expect(cancel).toHaveBeenCalledTimes(1);
});

it('extracts a JSON error inside HTTP 200 without treating it as success or exposing raw text', async () => {
  const delta = vi.fn();
  const error = await consumeStream(
    Response.json({
      error: {
        code: 'subscription_sharing_unsupported_capability',
        param: 'model',
        message: 'secret provider text',
      },
    }),
    delta,
  ).catch((e) => e);
  expect(error).toMatchObject({
    code: 'UNSUPPORTED_REQUEST',
    diagnostic: {
      stage: 'protocol',
      status: 200,
      shape: 'error',
      contentType: 'application/json',
      param: 'model',
    },
  });
  expect(JSON.stringify(error)).not.toContain('secret');
  expect(delta).not.toHaveBeenCalled();
});

it.each([
  ['<html>provider page</html>', 'text/html', 'non_json'],
  ['', 'text/plain', 'empty'],
  ['{"output_text":"not a completed stream"}', 'application/json', 'other'],
])('rejects non-stream body %s without emitting text', async (body, contentType, shape) => {
  const delta = vi.fn();
  const error = await consumeStream(
    new Response(body, { headers: { 'Content-Type': contentType } }),
    delta,
  ).catch((e) => e);
  expect(error).toMatchObject({
    code: 'PROVIDER_ERROR',
    diagnostic: { stage: 'protocol', status: 200, contentType, shape },
  });
  expect(delta).not.toHaveBeenCalled();
});

it('retains interrupted-stream handling when SSE arrives without a media type', async () => {
  await expect(
    consumeStream(
      new Response('data: {"type":"response.output_text.delta","delta":"Halo"}\n\n'),
      () => {},
    ),
  ).rejects.toMatchObject({ code: 'STREAM_INTERRUPTED' });
});

it('bounds JSON and unknown-body inspection without reading unlimited input', async () => {
  for (const body of ['{' + ' '.repeat(1048576), 'x'.repeat(5000)]) {
    const delta = vi.fn();
    await expect(consumeStream(new Response(body), delta)).rejects.toBeDefined();
    expect(delta).not.toHaveBeenCalled();
  }
});
