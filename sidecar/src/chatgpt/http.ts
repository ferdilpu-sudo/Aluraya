import { ChatError, providerError } from './errors';
import { diagnostic } from './diagnostics';

export const ISSUER = 'https://auth.openai.com';
export const RESOURCE = 'https://api.openai.com/v1';
export const TOKEN_URL = `${ISSUER}/api/accounts/oauth/token`;
export const SCOPES =
  'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';

export async function readJson(response: Response): Promise<unknown> {
  if (!response.body)
    throw providerError(response.status, null, diagnostic(response, null, 'http', 'empty'));
  const reader = response.body.getReader();
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1048576)
        throw new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol'));
      parts.push(value);
    }
    const data: unknown = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!response.ok) throw providerError(response.status, data, diagnostic(response, data));
    return data;
  } catch (error) {
    if (error instanceof ChatError) throw error;
    throw response.ok
      ? new ChatError('PROVIDER_ERROR', diagnostic(response, null, 'protocol', 'non_json'))
      : providerError(response.status, null, diagnostic(response, null, 'http', 'non_json'));
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export async function requestJson(url: string, init: RequestInit = {}): Promise<unknown> {
  return readJson(
    await fetch(url, {
      ...init,
      redirect: 'error',
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    }),
  );
}
