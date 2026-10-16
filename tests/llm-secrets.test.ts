import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { WindowsLlmSecrets } from '../sidecar/src/llm/secretStore';
import { llmConnection } from '../src/contracts/llm';
import { newProviderProfile } from '../src/contracts/providers';
it.skipIf(process.platform !== 'win32')(
  'stores DPAPI ciphertext and binds key to destination/auth/profile',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'aluraya-llm-'));
    const store = new WindowsLlmSecrets(directory);
    const c = llmConnection(newProviderProfile('llm'), 'max_tokens');
    try {
      await store.write(c, 'fixture-secret-llm');
      const files = await readdir(directory);
      expect(files).toHaveLength(1);
      expect(await readFile(join(directory, files[0]!), 'utf8')).not.toContain(
        'fixture-secret-llm',
      );
      expect(await store.read(c)).toBe('fixture-secret-llm');
      expect(await store.read({ ...c, baseUrl: 'https://different.example.com' })).toBeNull();
      await store.remove(c);
      expect(await store.read(c)).toBeNull();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
  30000,
);
