import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { ChatError } from './errors';
import { ISSUER, RESOURCE, SCOPES } from './http';
import type { Account } from './store';

export interface AuthorizationResult {
  code: string;
  clientId: string;
  verifier: string;
  nonce: string;
  redirectUri: string;
}
export function parseCallback(url: URL, expectedState: string, existingClient?: string) {
  for (const key of ['state', 'code', 'client_id', 'error']) {
    if (url.searchParams.getAll(key).length > 1) throw new ChatError('INVALID_CALLBACK');
  }
  const returned = Buffer.from(url.searchParams.get('state') ?? '');
  const expected = Buffer.from(expectedState);
  if (returned.length !== expected.length || !timingSafeEqual(returned, expected))
    throw new ChatError('INVALID_CALLBACK');
  if (url.searchParams.has('error')) throw new ChatError('LOGIN_DENIED');
  const code = url.searchParams.get('code');
  const clientId = url.searchParams.get('client_id') ?? existingClient;
  if (
    !code ||
    code.length > 8000 ||
    !clientId ||
    !/^oaiapp_[A-Za-z0-9_-]{1,200}$/.test(clientId) ||
    (existingClient && clientId !== existingClient)
  )
    throw new ChatError('INVALID_CALLBACK');
  return { code, clientId };
}

export function authorize(
  hostId: string,
  account: Account | undefined,
  openBrowser: (url: string) => Promise<void>,
  signal: AbortSignal,
): Promise<AuthorizationResult> {
  return new Promise((resolve, reject) => {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const verifier = randomBytes(64).toString('base64url');
    let redirectUri = '';
    let settled = false;
    const finish = (error?: ChatError, value?: AuthorizationResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      server.close();
      server.closeAllConnections();
      if (error) reject(error);
      else resolve(value!);
    };
    const cancel = () => finish(new ChatError('LOGIN_CANCELLED'));
    const server = createServer(
      { maxHeaderSize: 16384, requestTimeout: 5000 },
      (request, response) => {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Referrer-Policy', 'no-referrer');
        response.setHeader('Content-Security-Policy', "default-src 'none'");
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        const url = new URL(request.url ?? '/', redirectUri || 'http://127.0.0.1');
        if (
          request.method !== 'GET' ||
          request.headers.host !== new URL(redirectUri).host ||
          url.pathname !== '/auth/callback' ||
          url.origin !== new URL(redirectUri).origin ||
          settled
        ) {
          response.writeHead(404).end('Not found');
          return;
        }
        try {
          const result = parseCallback(url, state, account?.clientId);
          // Consume once before asynchronous token exchange. Never reflect query data.
          response.end('Login diterima. Kembali ke Aluraya untuk melihat hasil verifikasi.');
          finish(undefined, { ...result, verifier, nonce, redirectUri });
        } catch (error) {
          response.writeHead(400).end('Login tidak dapat diverifikasi. Mulai lagi dari Aluraya.');
          finish(error instanceof ChatError ? error : new ChatError('INVALID_CALLBACK'));
        }
      },
    );
    server.on('error', () => finish(new ChatError('NETWORK_ERROR')));
    const timer = setTimeout(() => finish(new ChatError('LOGIN_TIMEOUT')), 180000);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        finish(new ChatError('NETWORK_ERROR'));
        return;
      }
      redirectUri = `http://127.0.0.1:${address.port}/auth/callback`;
      const params = new URLSearchParams({
        client_id: account?.clientId ?? 'dynamic_agent_client',
        ext_agent_host_id: hostId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES,
        resource: RESOURCE,
        state,
        nonce,
        code_challenge_method: 'S256',
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      });
      if (!account) params.set('agent_name_hint', 'Aluraya Studio');
      if (account?.credentials?.idToken) params.set('id_token_hint', account.credentials.idToken);
      if (account?.email) params.set('login_hint', account.email);
      if (account && !account.credentials?.scopes.includes('chatgpt.tokens.use.direct'))
        params.set('prompt', 'consent');
      void openBrowser(`${ISSUER}/api/accounts/authorize?${params}`).catch(() =>
        finish(new ChatError('NETWORK_ERROR')),
      );
    });
  });
}
