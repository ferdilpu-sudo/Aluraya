import { chatDiagnosticSchema, type ChatDiagnostic } from '../../../src/contracts/chatDiagnostic';

// Only bounded machine fields cross IPC. Never include messages, detail text,
// response bodies, prompts, headers or OAuth credentials in diagnostics.
export function diagnostic(
  response: Response,
  body: unknown,
  stage: ChatDiagnostic['stage'] = 'http',
  shape?: ChatDiagnostic['shape'],
): ChatDiagnostic {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const error =
    value.error && typeof value.error === 'object' ? (value.error as Record<string, unknown>) : {};
  const safe = (field: 'code' | 'param' | 'requestId', value: unknown) => {
    const result = chatDiagnosticSchema.shape[field].safeParse(value);
    return result.success ? result.data : null;
  };
  return {
    stage,
    status: response.status,
    shape: shape ?? ('error' in value ? 'error' : 'detail' in value ? 'detail' : 'other'),
    code: safe('code', error.code ?? (typeof value.error === 'string' ? value.error : null)),
    param: safe('param', error.param ?? null),
    requestId: safe('requestId', response.headers.get('x-request-id')),
  };
}
