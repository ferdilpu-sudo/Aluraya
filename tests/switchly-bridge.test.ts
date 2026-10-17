import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwitchlyBridgeServer } from '../sidecar/src/switchly-bridge';
import type { ChatSession } from '../sidecar/src/chatgpt/session';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((f) => f()));
});

function fakeChat() {
  const replyOnce = vi.fn(async (_model: string, _prompt: string) => 'Approved story proposal');
  const cancelBridge = vi.fn();
  const snapshot = () =>
    ({
      signedIn: true,
      planEnabled: true,
      planConfirmed: true,
      usagePaused: false,
      models: [{ id: 'example-model', name: 'Example Model' }],
    }) as ReturnType<ChatSession['snapshot']>;
  return { snapshot, replyOnce, cancelBridge };
}

async function listeningHost() {
  const root = await mkdtemp(join(tmpdir(), 'aluraya-bridge-'));
  const path = join(root, 'bridge.sock');
  const server = new SwitchlyBridgeServer(path, true);
  const chat = fakeChat();
  const status = server.enable(chat);
  const start = Date.now();
  while (!server.status().bridgeActive && Date.now() - start < 2000)
    await new Promise((resolve) => setTimeout(resolve, 10));
  expect(server.status().bridgeActive).toBe(true);
  cleanup.push(async () => {
    server.disable();
    await rm(root, { recursive: true, force: true });
  });
  return { path, code: status.bridgeCode!, server, chat };
}

async function send(path: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = connect(path);
    let data = '';
    socket.setEncoding('utf8');
    socket.on('error', reject);
    socket.on('connect', () => socket.write(JSON.stringify(body) + '\n'));
    socket.on('data', (chunk: string) => { data += chunk; });
    socket.on('end', () => resolve(JSON.parse(data)));
  });
}

describe('Switchly paired local bridge', () => {
  it('requires an explicit user-enable and never returns tokens or account data', async () => {
    const { path, code } = await listeningHost();
    const result = await send(path, {
      schemaVersion: 1, requestId: randomUUID(), pairingCode: code, operation: 'inspect',
    }) as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.models).toEqual([{ id: 'example-model', name: 'Example Model' }]);
    expect(JSON.stringify(result)).not.toContain('accessToken');
    expect(JSON.stringify(result)).not.toContain('email');
  });

  it('refuses incorrect pairs without sending model requests', async () => {
    const { path, chat } = await listeningHost();
    const result = await send(path, {
      schemaVersion: 1, requestId: randomUUID(),
      pairingCode: 'A'.repeat(43), operation: 'send',
      model: 'example-model', text: 'Write a drama',
    }) as Record<string, unknown>;
    expect(result.error).toBe('BRIDGE_ACCESS_DENIED');
    expect(chat.replyOnce).not.toHaveBeenCalled();
  });

  it('accepts a bounded one-shot reply and does not expose provider credentials', async () => {
    const { path, code, chat } = await listeningHost();
    const result = await send(path, {
      schemaVersion: 1, requestId: randomUUID(),
      pairingCode: code, operation: 'send',
      model: 'example-model', text: 'Write two scenes',
    }) as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.reply).toBe('Approved story proposal');
    expect(chat.replyOnce).toHaveBeenCalledWith('example-model', 'Write two scenes');
  });

  it('blocks malformed, unpaired and disabled connections', async () => {
    const { path, code, server } = await listeningHost();
    const result = await send(path, {
      schemaVersion: 1, requestId: randomUUID(),
      pairingCode: code, operation: 'send',
      model: 'unsupported', text: 'Not allowed',
    }) as Record<string, unknown>;
    expect(result.error).toBe('BRIDGE_INVALID_MODEL');
    expect(server.disable().bridgeCode).toBe(null);
  });
});
