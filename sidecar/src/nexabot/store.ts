import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { apiKeySchema, jobSchema, type NexaJob } from '../../../src/contracts/nexabot';
import { protect, unprotect } from '../chatgpt/windows';
import { NexaError } from './errors';

export const keyFingerprint = (key: string) => createHash('sha256').update(key).digest('hex');
export class NexaStore {
  private db: DatabaseSync | null = null;
  constructor(
    readonly directory: string,
    private readonly cipher = { protect, unprotect },
  ) {}
  async open(): Promise<string | null> {
    await mkdir(join(this.directory, 'media'), { recursive: true });
    const { DatabaseSync } = await import('node:sqlite');
    this.db = new DatabaseSync(join(this.directory, 'jobs.sqlite'));
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
    const version = this.db.prepare('PRAGMA user_version').get()?.user_version;
    if (version !== 0 && version !== 1) throw new NexaError('STORAGE_ERROR');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS jobs (sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, body TEXT NOT NULL); PRAGMA user_version=1;',
    );
    // A durable pre-submit record without an acknowledged ID must never be resubmitted.
    for (const row of this.db
      .prepare("SELECT body FROM jobs WHERE json_extract(body, '$.state') = 'submitting'")
      .all()) {
      const job = jobSchema.parse(JSON.parse(String(row.body)));
      this.update({ ...job, state: 'uncertain', error: 'SUBMIT_UNCERTAIN' });
    }
    try {
      return apiKeySchema.parse(
        await this.cipher.unprotect(await readFile(join(this.directory, 'key.dpapi'), 'utf8')),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new NexaError('STORAGE_ERROR');
    }
  }
  async saveKey(key: string | null) {
    const target = join(this.directory, 'key.dpapi');
    if (key === null) {
      await unlink(target).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
      return;
    }
    const temporary = join(this.directory, `${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, await this.cipher.protect(apiKeySchema.parse(key)), {
        flag: 'wx',
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  insert(job: NexaJob, key: string) {
    this.database()
      .prepare('INSERT INTO jobs (id, fingerprint, body) VALUES (?, ?, ?)')
      .run(job.id, keyFingerprint(key), JSON.stringify(jobSchema.parse(job)));
  }
  update(job: NexaJob) {
    this.database()
      .prepare('UPDATE jobs SET body = ? WHERE id = ?')
      .run(JSON.stringify(jobSchema.parse(job)), job.id);
  }
  get(id: string, key: string): NexaJob {
    const row = this.database().prepare('SELECT fingerprint, body FROM jobs WHERE id = ?').get(id);
    if (!row) throw new NexaError('NOT_FOUND');
    if (row.fingerprint !== keyFingerprint(key)) throw new NexaError('KEY_MISMATCH');
    return jobSchema.parse(JSON.parse(String(row.body)));
  }
  list(page: number): NexaJob[] {
    return this.database()
      .prepare('SELECT body FROM jobs ORDER BY sequence DESC LIMIT 3 OFFSET ?')
      .all(page * 3)
      .map((row) => jobSchema.parse(JSON.parse(String(row.body))));
  }
  active(): string | null {
    const row = this.database()
      .prepare(
        "SELECT id FROM jobs WHERE json_extract(body, '$.state') IN ('submitting','uncertain','queued','processing','done') ORDER BY sequence LIMIT 1",
      )
      .get();
    return row ? String(row.id) : null;
  }
  count(): number {
    return Number(this.database().prepare('SELECT count(*) AS total FROM jobs').get()?.total ?? 0);
  }
  private database() {
    if (!this.db) throw new NexaError('STORAGE_ERROR');
    return this.db;
  }
  close() {
    this.db?.close();
    this.db = null;
  }
}
