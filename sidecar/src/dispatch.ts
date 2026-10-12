import { requestSchema, responseSchema } from '../../src/contracts/sidecar';
import { inspectHealth } from './health';

export function dispatch(frame: string): string {
  // Parse errors are fatal to the channel; never reflect arbitrary input or secrets.
  const request = requestSchema.parse(JSON.parse(frame) as unknown);
  return JSON.stringify(
    responseSchema.parse({
      schemaVersion: 1,
      requestId: request.requestId,
      ok: true,
      payload: inspectHealth(),
    }),
  );
}
