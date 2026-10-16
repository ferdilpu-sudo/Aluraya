import { createHash, randomUUID } from 'node:crypto';
import { mkdir, stat, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { protect, unprotect } from '../chatgpt/windows';
import type { LlmConnection } from '../../../src/contracts/llm';
export interface LlmSecretStore {
  read(c: LlmConnection): Promise<string | null>;
  write(c: LlmConnection, key: string): Promise<void>;
  remove(c: LlmConnection): Promise<void>;
}
export function secretScope(c: LlmConnection) {
  return createHash('sha256')
    .update(JSON.stringify([c.id, c.baseUrl, c.endpoint, c.auth]))
    .digest('hex');
}
const savedSchema = z
  .object({
    scope: z.string().regex(/^[a-f0-9]{64}$/),
    key: z
      .string()
      .min(1)
      .max(4096)
      .regex(/^[\x21-\x7E]+$/),
  })
  .strict();
export class WindowsLlmSecrets implements LlmSecretStore {
  constructor(private readonly directory: string) {}
  private path(c: LlmConnection) {
    return join(this.directory, `${createHash('sha256').update(c.id).digest('hex')}.dpapi`);
  }
  async read(c: LlmConnection) {
    try {
      if ((await stat(this.path(c))).size > 32768) throw new Error('STORAGE_ERROR');
      const saved = savedSchema.parse(
        JSON.parse(await unprotect(await readFile(this.path(c), 'utf8'))),
      );
      return saved.scope === secretScope(c) ? saved.key : null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new Error('STORAGE_ERROR', { cause: error });
    }
  }
  async write(c: LlmConnection, key: string) {
    const encrypted = await protect(
      JSON.stringify(savedSchema.parse({ scope: secretScope(c), key })),
    );
    await mkdir(this.directory, { recursive: true });
    const temporary = join(this.directory, `${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, encrypted, { flag: 'wx', mode: 0o600 });
      await rename(temporary, this.path(c));
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  async remove(c: LlmConnection) {
    await unlink(this.path(c)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e;
    });
  }
}
