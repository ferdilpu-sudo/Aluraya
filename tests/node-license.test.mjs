import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { resolveNodeLicense } from '../scripts/node-license.mjs';

// Synthetic fixture tests resolution, not compliance with the complete upstream notice.
const license = 'Node.js test fixture. Permission is hereby granted to test resolution.';
const directories = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'aluraya-license-'));
  directories.push(directory);
  await mkdir(join(directory, 'node'));
  return {
    executable: join(directory, 'node', 'node.exe'),
    version: 'v24.19.0',
    cacheDirectory: join(directory, 'cache'),
    directory,
  };
}

it('accepts LICENSE.txt beside an installed runtime without networking', async () => {
  const options = await setup();
  await writeFile(join(options.directory, 'node', 'LICENSE.txt'), license);
  const fetcher = vi.fn();
  expect((await resolveNodeLicense({ ...options, fetcher })).source).toBe('local:LICENSE.txt');
  expect(fetcher).not.toHaveBeenCalled();
});

it('falls back to the exact release and reuses its cache offline', async () => {
  const options = await setup();
  const fetcher = vi.fn(async () => new globalThis.Response(license));
  const result = await resolveNodeLicense({ ...options, fetcher });
  expect(result.text).toBe(license);
  expect(fetcher.mock.calls[0][0]).toBe(
    'https://raw.githubusercontent.com/nodejs/node/v24.19.0/LICENSE',
  );
  expect((await resolveNodeLicense({ ...options, fetcher })).source).toBe('version-cache');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(await readFile(join(options.cacheDirectory, 'v24.19.0.txt'), 'utf8')).toBe(license);
});

it('does not use an older cached release for a different Node patch', async () => {
  const options = await setup();
  await mkdir(options.cacheDirectory);
  await writeFile(join(options.cacheDirectory, 'v24.18.0.txt'), license);
  const fetcher = vi.fn(async () => new globalThis.Response('missing', { status: 404 }));
  await expect(resolveNodeLicense({ ...options, fetcher })).rejects.toThrow(
    'official Node v24.19.0',
  );
});

it('rejects an HTML response and never caches it as a license', async () => {
  const options = await setup();
  await expect(
    resolveNodeLicense({
      ...options,
      fetcher: async () => new globalThis.Response('<html>proxy error</html>'),
    }),
  ).rejects.toThrow('ALURAYA_NODE_LICENSE_FILE');
  await expect(readFile(join(options.cacheDirectory, 'v24.19.0.txt'))).rejects.toThrow();
});

it('supports an explicit offline license without downloading', async () => {
  const options = await setup();
  const explicitPath = join(options.directory, 'official-license.txt');
  await writeFile(explicitPath, license);
  const fetcher = vi.fn();
  expect((await resolveNodeLicense({ ...options, explicitPath, fetcher })).source).toBe(
    'explicit-file',
  );
  expect(fetcher).not.toHaveBeenCalled();
});

it('rejects a tampered version before reading or downloading', async () => {
  const options = await setup();
  const fetcher = vi.fn();
  await expect(resolveNodeLicense({ ...options, version: '../main', fetcher })).rejects.toThrow(
    'stable Node 24',
  );
  expect(fetcher).not.toHaveBeenCalled();
});
