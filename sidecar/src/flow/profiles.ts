import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
const schema = z.array(z.object({ id: z.uuid(), browser: z.enum(['chrome', 'msedge']) }).strict());
export type Profile = z.infer<typeof schema>[number];
export interface ProfileStore {
  load(): Promise<Profile[]>;
  save(profiles: Profile[]): Promise<void>;
  directory(id: string): string;
}
export class FlowProfiles implements ProfileStore {
  constructor(private readonly root: string) {}
  directory(id: string) {
    return join(this.root, z.uuid().parse(id));
  }
  async load() {
    await mkdir(this.root, { recursive: true });
    try {
      return schema.parse(JSON.parse(await readFile(join(this.root, 'profiles.json'), 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw new Error('STORAGE_ERROR', { cause: error });
    }
  }
  async save(profiles: Profile[]) {
    const path = join(this.root, `profiles-${randomUUID()}.tmp`);
    await writeFile(path, JSON.stringify(schema.parse(profiles)), { mode: 0o600 });
    await rename(path, join(this.root, 'profiles.json'));
  }
}
