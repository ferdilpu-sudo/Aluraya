import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { expect, it } from 'vitest';
import { responseSchema } from '../src/contracts/sidecar';

it('bundled sidecar handles two commands and exits when host closes stdin', async () => {
  const child = spawn(process.execPath, ['sidecar/dist/main.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let output = '';
  let errors = '';
  child.stdout.setEncoding('utf8').on('data', (data: string) => {
    output += data;
  });
  child.stderr.setEncoding('utf8').on('data', (data: string) => {
    errors += data;
  });
  const timeout = setTimeout(() => child.kill(), 4000);
  const ids = ['a9f38b6e-7399-4139-828a-e0d37b8f687d', 'a553aa4d-254b-4b50-8511-a25635c215ff'];
  try {
    const closed = once(child, 'close');
    for (const requestId of ids)
      child.stdin.write(
        JSON.stringify({ schemaVersion: 1, requestId, type: 'health.inspect', payload: {} }) + '\n',
      );
    child.stdin.end();
    const [code] = await closed;
    expect(code).toBe(0);
    expect(errors).toBe('');
    const responses = output
      .trim()
      .split('\n')
      .map((line) => responseSchema.parse(JSON.parse(line)));
    expect(responses.map((response) => response.requestId)).toEqual(ids);
  } finally {
    clearTimeout(timeout);
    child.kill();
  }
});

it('bundled sidecar terminates on invalid requests without echoing the input', async () => {
  const child = spawn(process.execPath, ['sidecar/dist/main.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let output = '';
  let errors = '';
  child.stdout.on('data', (data: Buffer) => {
    output += data.toString();
  });
  child.stderr.on('data', (data: Buffer) => {
    errors += data.toString();
  });
  const timeout = setTimeout(() => child.kill(), 4000);
  try {
    const closed = once(child, 'close');
    child.stdin.end('{"secret":"sensitive-fixture"}\n');
    const [code] = await closed;
    expect(code).toBe(1);
    expect(output).toBe('');
    expect(errors).toBe('ALURAYA_PROTOCOL_ERROR\n');
  } finally {
    clearTimeout(timeout);
    child.kill();
  }
});
