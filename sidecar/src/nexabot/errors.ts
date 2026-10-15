import { type NexaErrorCode } from '../../../src/contracts/nexabot';
export class NexaError extends Error {
  constructor(public readonly code: NexaErrorCode) {
    super(code);
  }
}
export function errorCode(error: unknown): NexaErrorCode {
  return error instanceof NexaError ? error.code : 'STORAGE_ERROR';
}
export function httpError(status: number): NexaError {
  const codes: Record<number, NexaErrorCode> = {
    400: 'INVALID_REQUEST',
    401: 'INVALID_KEY',
    402: 'INSUFFICIENT_CREDIT',
    403: 'ACCESS_DENIED',
    404: 'NOT_FOUND',
    429: 'RATE_LIMIT',
  };
  return new NexaError(codes[status] ?? 'PROVIDER_ERROR');
}
