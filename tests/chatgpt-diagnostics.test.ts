import { expect, it } from 'vitest';
import { ChatError } from '../sidecar/src/chatgpt/errors';
import { consumeStream } from '../sidecar/src/chatgpt/inference';
import { readJson } from '../sidecar/src/chatgpt/http';
import { chatDiagnosticSchema } from '../src/contracts/chatDiagnostic';

it('preserves HTTP error status, code, param and request ID without copying provider message or secrets', async () => {
  const response = Response.json(
    {
      error: {
        code: 'invalid_request_error',
        param: 'input[0].content',
        message: 'Bearer fixture-secret; private prompt',
      },
      access_token: 'fixture-secret',
    },
    { status: 400, headers: { 'x-request-id': 'req_fixture' } },
  );
  const error = await consumeStream(response, () => {}).catch((error) => error);
  expect(error).toMatchObject({
    code: 'PROVIDER_ERROR',
    diagnostic: {
      stage: 'http',
      status: 400,
      shape: 'error',
      code: 'invalid_request_error',
      param: 'input[0].content',
      requestId: 'req_fixture',
    },
  });
  expect(JSON.stringify(error)).not.toMatch(/fixture-secret|private prompt|message|access_token/);
  expect(chatDiagnosticSchema.safeParse(error.diagnostic).success).toBe(true);
});

it('distinguishes direct-admission detail and non-JSON errors while retaining HTTP status', async () => {
  const detail = await readJson(
    Response.json({ detail: 'private account detail' }, { status: 403 }),
  ).catch((e) => e);
  expect(detail).toMatchObject({
    code: 'ACCESS_DENIED',
    diagnostic: { status: 403, shape: 'detail', code: null },
  });
  expect(JSON.stringify(detail)).not.toContain('private account');
  const html = await readJson(
    new Response('<html>private proxy error</html>', { status: 502 }),
  ).catch((e) => e);
  if (!(html instanceof ChatError)) throw new Error('Expected a structured HTTP error');
  expect(html.diagnostic).toMatchObject({ status: 502, shape: 'non_json' });
  expect(JSON.stringify(html)).not.toContain('private proxy');
});

it('keeps the actual HTTP 200 for SSE failures and maps quota unavailability by code', async () => {
  const response = new Response(
    'data: {"type":"response.failed","response":{"error":{"code":"subscription_sharing_usage_unavailable","param":"model","message":"private"}}}\n\n',
    {
      headers: { 'Content-Type': 'text/event-stream', 'x-request-id': 'req_stream' },
    },
  );
  const error = await consumeStream(response, () => {}).catch((e) => e);
  expect(error).toMatchObject({
    code: 'USAGE_UNAVAILABLE',
    diagnostic: {
      stage: 'stream',
      status: 200,
      code: 'subscription_sharing_usage_unavailable',
      param: 'model',
      requestId: 'req_stream',
    },
  });
});

it('identifies malformed SSE and unexpected success content types as protocol failures', async () => {
  for (const response of [
    new Response('data: invalid-json\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
    Response.json({ text: 'not a stream' }),
  ]) {
    const error = await consumeStream(response, () => {}).catch((e) => e);
    expect(error).toMatchObject({
      code: 'PROVIDER_ERROR',
      diagnostic: { stage: 'protocol', status: 200 },
    });
  }
});

it('drops malformed or oversized diagnostic identifiers and rejects extra snapshot fields', async () => {
  const error = await readJson(
    Response.json(
      {
        error: {
          code: 'Bearer secret',
          param: 'x'.repeat(101),
          message: 'secret',
        },
      },
      { status: 400, headers: { 'x-request-id': 'Bearer secret' } },
    ),
  ).catch((e) => e);
  if (!(error instanceof ChatError)) throw new Error('Expected a structured HTTP error');
  expect(error.diagnostic).toMatchObject({ code: null, param: null, requestId: null });
  expect(
    chatDiagnosticSchema.safeParse({ ...error.diagnostic, accessToken: 'secret' }).success,
  ).toBe(false);
});
