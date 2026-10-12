import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { protect, unprotect } from './windows';
import { ChatError } from './errors';

export const credentialSchema = z
  .object({
    accessToken: z.string().min(1).max(20000),
    refreshToken: z.string().min(1).max(20000),
    idToken: z.string().min(1).max(20000),
    expiresAt: z.number(),
    scopes: z.array(z.string()),
  })
  .strict();
export const accountSchema = z
  .object({
    id: z.uuid(),
    clientId: z.string().regex(/^oaiapp_[A-Za-z0-9_-]+$/),
    subject: z.string().min(1),
    email: z.string().max(320).nullable(),
    credentials: credentialSchema.nullable(),
    welcomeSeen: z.boolean(),
  })
  .strict();
export type Credentials = z.infer<typeof credentialSchema>;
export type Account = z.infer<typeof accountSchema>;
const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    hostId: z.string().regex(/^urn:uuid:/),
    activeId: z.uuid().nullable(),
    accounts: z.array(accountSchema),
  })
  .strict();
export type SavedState = z.infer<typeof stateSchema>;
export interface CredentialStore {
  load(): Promise<SavedState>;
  save(state: SavedState): Promise<void>;
  close(): Promise<void>;
}
export class WindowsStore implements CredentialStore {
  private locked = false;
  constructor(private readonly directory: string) {}
  async load(): Promise<SavedState> {
    if (process.platform !== 'win32') throw new ChatError('WINDOWS_REQUIRED');
    await mkdir(this.directory, { recursive: true });
    // The native host owns an exclusive OS file handle for this directory.
    this.locked = true;
    try {
      const encrypted = await readFile(join(this.directory, 'accounts.dpapi'), 'utf8');
      if (encrypted.length > 4 * 1048576) throw new ChatError('STORAGE_ERROR');
      return stateSchema.parse(JSON.parse(await unprotect(encrypted)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const state: SavedState = {
          schemaVersion: 1,
          hostId: `urn:uuid:${randomUUID()}`,
          activeId: null,
          accounts: [],
        };
        await this.save(state);
        return state;
      }
      throw new ChatError('STORAGE_ERROR');
    }
  }
  async save(state: SavedState): Promise<void> {
    if (!this.locked) throw new ChatError('STORAGE_ERROR');
    const encrypted = await protect(JSON.stringify(stateSchema.parse(state)));
    const temporary = join(this.directory, `accounts-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, encrypted, { flag: 'wx', mode: 0o600 });
      await rename(temporary, join(this.directory, 'accounts.dpapi'));
    } catch {
      throw new ChatError('STORAGE_ERROR');
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  async close(): Promise<void> {
    this.locked = false;
  }
}
