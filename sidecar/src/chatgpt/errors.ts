import type { ChatDiagnostic } from '../../../src/contracts/chatDiagnostic';
import type { ChatErrorCode } from '../../../src/contracts/chat';

export class ChatError extends Error {
  constructor(
    public readonly code: ChatErrorCode,
    public diagnostic: ChatDiagnostic | null = null,
  ) {
    super(code);
  }
}
export function safeError(error: unknown): ChatErrorCode {
  return error instanceof ChatError ? error.code : 'NETWORK_ERROR';
}
export function providerError(
  status: number,
  body: unknown,
  diagnostic: ChatDiagnostic | null = null,
): ChatError {
  const error = classifyProviderError(status, body);
  error.diagnostic = diagnostic;
  return error;
}
function classifyProviderError(status: number, body: unknown): ChatError {
  const value = body as { error?: { code?: string } | string } | null;
  const code = typeof value?.error === 'string' ? value.error : value?.error?.code;
  if (
    [
      'invalid_grant',
      'invalid_refresh_token',
      'token_expired',
      'refresh_token_expired',
      'refresh_token_invalidated',
      'refresh_token_reused',
    ].includes(code ?? '')
  )
    return new ChatError('LOGIN_REQUIRED');
  if (code === 'subscription_sharing_usage_limit_exceeded' || status === 429)
    return new ChatError('USAGE_LIMIT');
  if (code === 'subscription_sharing_user_not_eligible') return new ChatError('NOT_ELIGIBLE');
  if (code === 'subscription_sharing_unsupported_capability')
    return new ChatError('UNSUPPORTED_REQUEST');
  if (status === 401) return new ChatError('LOGIN_REQUIRED');
  if (status === 403) return new ChatError('ACCESS_DENIED');
  if (
    code === 'subscription_sharing_usage_unavailable' ||
    code === 'subscription_sharing_user_unavailable' ||
    status === 503
  )
    return new ChatError('USAGE_UNAVAILABLE');
  return new ChatError('PROVIDER_ERROR');
}
