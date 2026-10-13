import { requestSchema, responseSchema, MAX_FRAME_BYTES } from '../../src/contracts/sidecar';
import { inspectHealth } from './health';
import { ChatSession } from './chatgpt/session';
import { WindowsStore } from './chatgpt/store';
import { FlowSession } from './flow/session';
import { FlowProfiles } from './flow/profiles';
let flow: FlowSession | null = null;

let chat: ChatSession | null = null;
export function dispatch(frame: string): string {
  const request = requestSchema.parse(JSON.parse(frame) as unknown);
  if (request.type === 'flow.action') {
    const directory = process.env.ALURAYA_FLOW_DIR;
    if (!directory) throw new Error('FLOW_DIRECTORY_MISSING');
    flow ??= new FlowSession(new FlowProfiles(directory));
    const response = JSON.stringify({
      schemaVersion: 1,
      requestId: request.requestId,
      ok: true,
      payload: flow.act(request.payload),
    });
    if (Buffer.byteLength(response) > MAX_FRAME_BYTES) throw new Error('FRAME_TOO_LARGE');
    return response;
  }
  if (request.type === 'chat.action') {
    const directory = process.env.ALURAYA_AUTH_DIR;
    if (!directory) throw new Error('AUTH_DIRECTORY_MISSING');
    chat ??= new ChatSession(new WindowsStore(directory));
    const response = JSON.stringify({
      schemaVersion: 1,
      requestId: request.requestId,
      ok: true,
      payload: chat.act(request.payload),
    });
    if (Buffer.byteLength(response) > MAX_FRAME_BYTES) throw new Error('FRAME_TOO_LARGE');
    return response;
  }
  const health = inspectHealth();
  const check = health.checks.find((item) => item.id === 'chatgpt');
  if (check) {
    const state = chat?.snapshot();
    check.state =
      state?.signedIn && state.planEnabled && state.models.length > 0 ? 'pass' : 'blocked';
    check.detail =
      check.state === 'pass'
        ? 'Login dan daftar model terverifikasi. Respons chat diuji melalui panel Copilot.'
        : 'Buka Copilot untuk login ChatGPT dan memeriksa izin penggunaan paket.';
  }
  return JSON.stringify(
    responseSchema.parse({
      schemaVersion: 1,
      requestId: request.requestId,
      ok: true,
      payload: health,
    }),
  );
}
export async function closeChat() {
  await Promise.allSettled([chat?.close(), flow?.close()]);
}
