import { afterEach, expect, it, vi } from 'vitest';
import { streamReply } from '../sidecar/src/chatgpt/inference';
import { renew } from '../sidecar/src/chatgpt/tokens';

afterEach(() => vi.unstubAllGlobals());
it('uses the supported OAuth Responses route without a paid key or unsupported request fields', async () => {
  const network = vi.fn(
    async () =>
      new Response('data: {"type":"response.completed"}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  );
  vi.stubGlobal('fetch', network);
  await streamReply(
    'oauth-fixture',
    'discovered-model',
    [{ role: 'user', content: 'Hi' }],
    new AbortController().signal,
    () => {},
  );
  const call = network.mock.calls[0] as unknown as [string, RequestInit];
  expect(call[0]).toBe('https://api.openai.com/v1/responses');
  expect(call[1].headers).toEqual({
    Authorization: 'Bearer oauth-fixture',
    'Content-Type': 'application/json',
  });
  const body = JSON.parse(call[1].body as string);
  expect(body).toMatchObject({
    store: false,
    stream: true,
    model: 'discovered-model',
    input: [{ role: 'user', content: 'Hi' }],
  });
  expect(Object.keys(body).sort()).toEqual(['input', 'instructions', 'model', 'store', 'stream']);
  expect(network).toHaveBeenCalledTimes(1);
});
it('refreshes with the issued client and replaces rotating tokens as one set', async () => {
  const network = vi.fn(async () =>
    Response.json({
      access_token: 'next-access',
      refresh_token: 'next-refresh',
      expires_in: 3600,
      scope: 'openid chatgpt.tokens.use.direct',
      token_type: 'Bearer',
    }),
  );
  vi.stubGlobal('fetch', network);
  const next = await renew(
    {
      id: '38d0587b-17b4-4abc-a6c2-c23aabdaae8d',
      clientId: 'oaiapp_saved',
      subject: 'subject',
      email: null,
      welcomeSeen: true,
      credentials: {
        accessToken: 'old',
        refreshToken: 'old-refresh',
        idToken: 'retained-id',
        expiresAt: 0,
        scopes: ['openid'],
      },
    },
    new AbortController().signal,
  );
  expect(next).toMatchObject({
    accessToken: 'next-access',
    refreshToken: 'next-refresh',
    idToken: 'retained-id',
  });
  const call = network.mock.calls[0] as unknown as [string, RequestInit];
  expect(call[0]).toBe('https://auth.openai.com/api/accounts/oauth/token');
  expect(Object.fromEntries(call[1].body as URLSearchParams)).toEqual({
    grant_type: 'refresh_token',
    client_id: 'oaiapp_saved',
    refresh_token: 'old-refresh',
    resource: 'https://api.openai.com/v1',
  });
});
