import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { llmConnection } from '../src/contracts/llm';
import { newProviderProfile } from '../src/contracts/providers';
import { chatCompletion, requestUrl } from '../sidecar/src/llm/chatCompletions';
const connection = llmConnection(newProviderProfile('llm'), 'max_completion_tokens');
const result = (text = 'Usulan', finish_reason = 'stop') => ({
  choices: [{ finish_reason, message: { content: text } }],
  usage: { prompt_tokens: 3, completion_tokens: 2 },
});
describe('Chat Completions transport', () => {
  it('sends one bounded request over real local HTTP and refuses redirect before forwarding credentials', async () => {
    const requests: { path: string; auth: string | undefined; body: string }[] = [];
    const server = createServer(async (req, res) => {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      requests.push({
        path: req.url!,
        auth: req.headers.authorization,
        body: Buffer.concat(chunks).toString(),
      });
      if (req.url === '/redirect') {
        res.writeHead(307, { Location: '/leak' });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result()));
      }
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error();
    const local = {
      ...connection,
      baseUrl: `http://127.0.0.1:${address.port}`,
      endpoint: '/v1/chat/completions',
    };
    try {
      const reply = await chatCompletion(
        local,
        'fixture-secret',
        'Naskah',
        123,
        new AbortController().signal,
      );
      expect(reply.text).toBe('Usulan');
      expect(requests[0]?.auth).toBe('Bearer fixture-secret');
      expect(JSON.parse(requests[0]!.body)).toEqual({
        model: connection.model,
        messages: [{ role: 'user', content: 'Naskah' }],
        stream: false,
        max_completion_tokens: 123,
      });
      await expect(
        chatCompletion(
          { ...local, endpoint: '/redirect' },
          'fixture-secret',
          'Naskah',
          123,
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: 'REQUEST_UNCERTAIN' });
      expect(requests.map((r) => r.path)).toEqual(['/v1/chat/completions', '/redirect']);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
  it('preserves base path, supports explicit legacy token field and redacts key echoes', async () => {
    expect(
      requestUrl({ ...connection, baseUrl: 'https://example.com/prefix/', endpoint: '/chat' }),
    ).toBe('https://example.com/prefix/chat');
    const fetcher = vi.fn(async () => Response.json(result('Echo fixture-secret', 'length')));
    const reply = await chatCompletion(
      { ...connection, tokenLimitField: 'max_tokens' },
      'fixture-secret',
      'x',
      16,
      new AbortController().signal,
      fetcher,
    );
    expect(reply).toMatchObject({ text: 'Echo [REDACTED]', state: 'incomplete' });
    expect(
      JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string),
    ).toHaveProperty('max_tokens', 16);
  });
  it('rejects malformed success, tool calls and oversized bodies without leaking raw error text', async () => {
    const bodies = [
      Response.json({ ok: true }),
      Response.json({
        choices: [
          {
            finish_reason: 'tool_calls',
            message: { content: 'x', tool_calls: [{ name: 'shell' }] },
          },
        ],
      }),
      new Response('x'.repeat(1048577), { headers: { 'content-type': 'application/json' } }),
    ];
    for (const response of bodies)
      await expect(
        chatCompletion(
          connection,
          'fixture-secret',
          'x',
          16,
          new AbortController().signal,
          async () => response,
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/INVALID_RESPONSE|OUTPUT_LIMIT/) });
    await expect(
      chatCompletion(
        connection,
        'fixture-secret',
        'x',
        16,
        new AbortController().signal,
        async () => new Response('fixture-secret', { status: 401 }),
      ),
    ).rejects.toMatchObject({ code: 'AUTH_REJECTED', message: 'AUTH_REJECTED' });
  });
});
