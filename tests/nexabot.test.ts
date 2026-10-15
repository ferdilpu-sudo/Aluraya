import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { NexaStore } from '../sidecar/src/nexabot/store';
import { NexaClient } from '../sidecar/src/nexabot/client';
import { NexaSession } from '../sidecar/src/nexabot/session';
import { nexaActionSchema, type NexaJob } from '../src/contracts/nexabot';
import { collectMedia } from '../sidecar/src/nexabot/media';
import { nexaErrorMessage } from '../src/features/nexabot/errors';

const key = 'nxb_fixture_not_a_real_api_key';
const cipher = {
  protect: async (s: string) => Buffer.from(s).toString('base64'),
  unprotect: async (s: string) => Buffer.from(s, 'base64').toString(),
};
const input = { mode: 'img' as const, prompt: 'Sebuah pohon', aspect: 2 as const };
const signal = () => new AbortController().signal;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const image = () =>
  new Response(Buffer.from([255, 216, 255, ...new Array<number>(20).fill(0)]), {
    headers: { 'content-type': 'image/jpeg' },
  });
const directories: string[] = [];
const sessions: NexaSession[] = [];
afterEach(async () => {
  for (const session of sessions.splice(0)) await session.close();
  for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true });
});
async function store() {
  const directory = await mkdtemp(join(tmpdir(), 'aluraya-nexabot-'));
  directories.push(directory);
  return new NexaStore(directory, cipher);
}
async function idle(session: NexaSession) {
  await vi.waitFor(() => expect(session.snapshot().activity).toBe('idle'));
  return session.snapshot();
}
async function setup(request: typeof fetch) {
  const disk = await store();
  const session = new NexaSession(disk, new NexaClient(request), 1);
  sessions.push(session);
  await idle(session);
  session.act({ action: 'save_key', key });
  await idle(session);
  session.act({ action: 'prepare', input });
  const quote = (await idle(session)).quote!;
  return { disk, session, quote };
}
it('binds approval to one immutable request; double submit cannot bill twice; media survives restart', async () => {
  let posts = 0;
  const request = vi.fn<typeof fetch>(async (url, init) => {
    expect(new Headers(init?.headers).get('x-api-key')).toBe(key);
    if (String(url).endsWith('/credit'))
      return json({ ok: true, registered: true, credit: 4, credit_cost: 0.15 });
    if (init?.method === 'POST') {
      posts++;
      expect(JSON.parse(String(init.body))).toEqual(input);
      return json({ ok: true, job_id: 'fixture_job', status: 'queued' }, 202);
    }
    if (String(url).endsWith('/download')) return image();
    return json({
      ok: true,
      job: {
        id: 'fixture_job',
        status: 'done',
        progress: 'ok:private@example.org',
        error: 'secret',
      },
    });
  });
  const { disk, session, quote } = await setup(request);
  session.act({ action: 'submit', approvalId: quote.id });
  session.act({ action: 'submit', approvalId: quote.id });
  const state = await idle(session);
  expect(posts).toBe(1);
  expect(state.jobs[0]?.state).toBe('ready');
  expect(JSON.stringify(state)).not.toContain(key);
  expect(JSON.stringify(state)).not.toContain('private@example.org');
  const bytes = await readFile(join(disk.directory, 'media', state.jobs[0]!.media!.fileName));
  expect(bytes.length).toBe(23);
  await session.close();
  sessions.splice(sessions.indexOf(session), 1);
  const restored = new NexaSession(new NexaStore(disk.directory, cipher), new NexaClient(request));
  sessions.push(restored);
  expect((await idle(restored)).jobs[0]?.media).toEqual(state.jobs[0]?.media);
  expect(posts).toBe(1);
});
it('checks fresh cost and rejects stale or changed approval before POST', async () => {
  let cost = 0.15;
  const request = vi.fn<typeof fetch>(async () =>
    json({ ok: true, registered: true, credit: 10, credit_cost: cost }),
  );
  const { session, quote } = await setup(request);
  cost = 0.3;
  session.act({ action: 'submit', approvalId: quote.id });
  expect((await idle(session)).error).toBe('COST_CHANGED');
  session.act({ action: 'submit', approvalId: quote.id });
  expect((await idle(session)).error).toBe('APPROVAL_STALE');
  expect(request.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
});
it('network loss during submit persists uncertain and blocks automatic re-submit across restart', async () => {
  let posts = 0;
  const request = vi.fn<typeof fetch>(async (_, init) => {
    if (init?.method === 'POST') {
      posts++;
      throw new Error(key);
    }
    return json({ ok: true, registered: true, credit: 10, credit_cost: 0.15 });
  });
  const { disk, session, quote } = await setup(request);
  session.act({ action: 'submit', approvalId: quote.id });
  expect((await idle(session)).jobs[0]?.state).toBe('uncertain');
  await session.close();
  sessions.splice(sessions.indexOf(session), 1);
  const restored = new NexaSession(new NexaStore(disk.directory, cipher), new NexaClient(request));
  sessions.push(restored);
  await idle(restored);
  restored.act({ action: 'prepare', input });
  expect((await idle(restored)).error).toBe('BUSY');
  expect(posts).toBe(1);
});
it('recovery of persisted submitting does not send any request and never mixes API keys', async () => {
  const disk = await store();
  await disk.open();
  const job: NexaJob = {
    id: randomUUID(),
    providerId: null,
    input,
    cost: 0.15,
    createdAt: Date.now(),
    chargedCost: null,
    state: 'submitting',
    error: null,
    media: null,
  };
  disk.insert(job, key);
  disk.close();
  await disk.open();
  expect(disk.list(0)[0]?.state).toBe('uncertain');
  expect(() => disk.get(job.id, 'different')).toThrow('KEY_MISMATCH');
  disk.close();
});
it('download retry resumes the same provider job, never generates again', async () => {
  let posts = 0;
  let downloads = 0;
  const request = vi.fn<typeof fetch>(async (url, init) => {
    if (String(url).endsWith('/credit'))
      return json({ ok: true, registered: true, credit: 1, credit_cost: 0.15 });
    if (init?.method === 'POST') {
      posts++;
      return json({ ok: true, job_id: 'fixture_job', status: 'queued' }, 202);
    }
    if (String(url).endsWith('/download')) {
      downloads++;
      if (downloads === 1) throw new Error('offline');
      return image();
    }
    return json({ ok: true, job: { id: 'fixture_job', status: 'done' } });
  });
  const { session, quote } = await setup(request);
  session.act({ action: 'submit', approvalId: quote.id });
  const job = (await idle(session)).jobs[0]!;
  expect(job.state).toBe('done');
  session.act({ action: 'resume', id: job.id });
  expect((await idle(session)).jobs[0]?.state).toBe('ready');
  expect(posts).toBe(1);
  expect(downloads).toBe(2);
});
it('blocks redirect credential leakage and rejects mismatched job IDs and malformed accepted responses', async () => {
  const redirect = vi.fn<typeof fetch>(
    async () =>
      new Response(null, { status: 302, headers: { location: 'https://other.example/file' } }),
  );
  await expect(new NexaClient(redirect).download(key, 'fixture', signal())).rejects.toThrow(
    'DOWNLOAD_REDIRECT',
  );
  expect(redirect).toHaveBeenCalledTimes(1);
  const mismatch = new NexaClient(async () =>
    json({ ok: true, job: { id: 'other', status: 'done' } }),
  );
  await expect(mismatch.status(key, 'fixture', signal())).rejects.toThrow('PROTOCOL_ERROR');
  await expect(
    new NexaClient(async () => new Response('bad', { status: 202 })).submit(key, input, signal()),
  ).rejects.toThrow('SUBMIT_UNCERTAIN');
});
it('rejects executable/HTML media and unsupported privileged input without exposing errors', async () => {
  const disk = await store();
  await disk.open();
  await expect(
    collectMedia(
      new Response('<html>secret</html>', { headers: { 'content-type': 'image/jpeg' } }),
      disk.directory,
      'img',
    ),
  ).rejects.toThrow('MEDIA_INVALID');
  disk.close();
  expect(
    nexaActionSchema.safeParse({
      action: 'submit',
      approvalId: randomUUID(),
      input,
      approved: true,
    }).success,
  ).toBe(false);
  expect(
    nexaActionSchema.safeParse({
      action: 'prepare',
      input: { ...input, media: ['file:///secret'] },
    }).success,
  ).toBe(false);
  expect(nexaErrorMessage(new Error(key))).not.toContain(key);
});
it.skipIf(process.platform !== 'win32')(
  'stores the actual Nexabot key using Windows DPAPI and removes it',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'aluraya-dpapi-'));
    directories.push(directory);
    const disk = new NexaStore(directory);
    await disk.open();
    await disk.saveKey(key);
    disk.close();
    expect(await readFile(join(directory, 'key.dpapi'), 'utf8')).not.toContain(key);
    const reopened = new NexaStore(directory);
    expect(await reopened.open()).toBe(key);
    await reopened.saveKey(null);
    reopened.close();
  },
);
