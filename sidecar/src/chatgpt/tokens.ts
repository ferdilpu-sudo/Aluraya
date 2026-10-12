import { z } from 'zod';
import { requestJson, TOKEN_URL, RESOURCE, ISSUER } from './http';
import { verifyIdentity } from './identity';
import { ChatError } from './errors';
import type { Account, Credentials } from './store';
import type { AuthorizationResult } from './oauth';

const tokenSchema = z.object({
  access_token: z.string().min(1).max(20000),
  refresh_token: z.string().min(1).max(20000),
  id_token: z.string().min(1).max(20000).optional(),
  expires_in: z.number().positive().max(86400),
  scope: z.string(),
  token_type: z.string().refine((value) => value.toLowerCase() === 'bearer'),
});
async function grant(body: Record<string, string>, signal: AbortSignal, previousIdToken?: string) {
  const parsed = tokenSchema.safeParse(
    await requestJson(TOKEN_URL, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...body, resource: RESOURCE }),
    }),
  );
  if (!parsed.success) throw new ChatError('PROVIDER_ERROR');
  const token = parsed.data;
  const idToken = token.id_token ?? previousIdToken;
  if (!idToken) throw new ChatError('INVALID_IDENTITY');
  const credentials: Credentials = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    idToken,
    expiresAt: Date.now() + token.expires_in * 1000,
    scopes: token.scope.split(/\s+/),
  };
  return { credentials, newIdToken: token.id_token };
}
export async function exchange(result: AuthorizationResult, signal: AbortSignal) {
  const { credentials } = await grant(
    {
      grant_type: 'authorization_code',
      client_id: result.clientId,
      code: result.code,
      code_verifier: result.verifier,
      redirect_uri: result.redirectUri,
    },
    signal,
  );
  const identity = await verifyIdentity(credentials.idToken, result.clientId, result.nonce);
  signal.throwIfAborted();
  return { credentials, ...identity };
}
export async function renew(account: Account, signal: AbortSignal): Promise<Credentials> {
  if (!account.credentials) throw new ChatError('LOGIN_REQUIRED');
  const { credentials, newIdToken } = await grant(
    {
      grant_type: 'refresh_token',
      client_id: account.clientId,
      refresh_token: account.credentials.refreshToken,
    },
    signal,
    account.credentials.idToken,
  );
  if (newIdToken) {
    const identity = await verifyIdentity(newIdToken, account.clientId);
    if (identity.subject !== account.subject) throw new ChatError('INVALID_IDENTITY');
  }
  return credentials;
}
export async function revoke(account: Account): Promise<boolean> {
  if (!account.credentials) return true;
  try {
    const config = z
      .object({ issuer: z.literal(ISSUER), revocation_endpoint: z.url() })
      .parse(await requestJson(`${ISSUER}/.well-known/openid-configuration`));
    const endpoint = new URL(config.revocation_endpoint);
    if (endpoint.origin !== ISSUER || endpoint.username || endpoint.password) return false;
    const response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: account.credentials.refreshToken,
        token_type_hint: 'refresh_token',
        client_id: account.clientId,
      }),
    });
    await response.body?.cancel();
    return response.status === 200;
  } catch {
    return false;
  }
}
