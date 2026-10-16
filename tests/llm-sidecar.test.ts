import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { llmConnection, llmSnapshotSchema, type LlmAction } from '../src/contracts/llm';
import { newProviderProfile } from '../src/contracts/providers';
it('bundled sidecar runs configure → review → submit → response over local fixture HTTP', async () => {
  let calls = 0;
  const server = createServer(async (req, res) => {
    for await (const chunk of req) void chunk;
    calls++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        choices: [{ finish_reason: 'stop', message: { content: 'Fixture local only' } }],
      }),
    );
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error();
  const directory = await mkdtemp(join(tmpdir(), 'aluraya-llm-ipc-'));
  const child = spawn(process.execPath, ['sidecar/dist/main.cjs'], {
    env: { ...process.env, ALURAYA_LLM_DIR: directory },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = createInterface({ input: child.stdout });
  let errors = '';
  child.stderr.on('data', (chunk) => {
    errors += chunk.toString();
  });
  const timer = setTimeout(() => child.kill(), 5000);
  async function act(payload: LlmAction) {
    const requestId = crypto.randomUUID();
    const line = once(lines, 'line');
    child.stdin.write(
      JSON.stringify({ schemaVersion: 1, requestId, type: 'llm.action', payload }) + '\n',
    );
    const response = JSON.parse((await line)[0]);
    expect(response.requestId).toBe(requestId);
    return llmSnapshotSchema.parse(response.payload);
  }
  try {
    const connection = llmConnection(
      {
        ...newProviderProfile('llm'),
        baseUrl: `http://127.0.0.1:${address.port}`,
        auth: { type: 'none' },
      },
      'max_tokens',
    );
    await act({ action: 'configure', connection });
    await act({ action: 'inspect' });
    const quote = (
      await act({
        action: 'prepare',
        text: 'hello fixture',
        maxTokens: 16,
        tariff: {
          currency: 'USD',
          inputPerMillion: 0,
          outputPerMillion: 0,
          perRequest: 0,
          checkedByUser: true,
        },
      })
    ).quote!;
    expect(calls).toBe(0);
    await act({ action: 'submit', approvalId: quote.id });
    let state = await act({ action: 'inspect' });
    for (let i = 0; state.activity !== 'idle' && i < 40; i++) {
      await new Promise((r) => setTimeout(r, 20));
      state = await act({ action: 'inspect' });
    }
    expect(state.reply?.text).toBe('Fixture local only');
    expect(calls).toBe(1);
    const closed = once(child, 'close');
    child.stdin.end();
    expect((await closed)[0]).toBe(0);
    expect(errors).toBe('');
  } finally {
    clearTimeout(timer);
    lines.close();
    child.kill();
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
    await rm(directory, { recursive: true, force: true });
  }
});
