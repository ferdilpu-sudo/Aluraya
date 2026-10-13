import { expect, it, vi } from 'vitest';
import { FlowSession } from '../sidecar/src/flow/session';
import { flowActionSchema, flowSnapshotSchema } from '../src/contracts/flow';
import type { ProfileStore, Profile } from '../sidecar/src/flow/profiles';
import type { FlowBrowser } from '../sidecar/src/flow/browser';
const id = '38d0587b-17b4-4abc-a6c2-c23aabdaae8d';
function setup(profiles: Profile[] = [{ id, browser: 'chrome' }]) {
  let closed = () => {};
  const browser: FlowBrowser = {
    close: vi.fn(async () => closed()),
    onClose: (callback) => {
      closed = callback;
    },
    observe: vi.fn(async () => ({
      observedAt: new Date().toISOString(),
      page: 'flow' as const,
      editorVisible: true,
      modelLabels: ['Veo 3.1'],
      creditLabels: ['100 credits'],
      costVerified: false as const,
    })),
  };
  const store: ProfileStore = {
    load: async () => profiles,
    save: vi.fn(async () => {}),
    directory: (profileId) => `/dedicated/${profileId}`,
  };
  const launch = vi.fn(async () => browser);
  return { browser, store, launch, session: new FlowSession(store, launch, 'win32') };
}
async function idle(session: FlowSession) {
  await vi.waitFor(() => expect(session.snapshot().activity).toBe('idle'));
}
it('opens only a saved dedicated profile, permits one browser and keeps observations unverified', async () => {
  const { session, browser, launch } = setup();
  await idle(session);
  session.act({ action: 'open', profileId: id });
  expect(session.act({ action: 'open', profileId: id }).error).toBe('BUSY');
  await idle(session);
  expect(launch).toHaveBeenCalledExactlyOnceWith(`/dedicated/${id}`, 'chrome');
  expect(session.act({ action: 'open', profileId: id }).error).toBe('PROFILE_ACTIVE');
  session.act({ action: 'observe' });
  await idle(session);
  expect(session.snapshot()).toMatchObject({
    generationReady: false,
    observation: { costVerified: false as const, editorVisible: true },
  });
  await session.close();
  expect(browser.close).toHaveBeenCalledTimes(1);
});
it('retains unlimited stored profiles via pagination without opening browsers on creation', async () => {
  const { session, launch, store } = setup(
    Array.from({ length: 12 }, () => ({ id: crypto.randomUUID(), browser: 'chrome' })),
  );
  await idle(session);
  expect(session.snapshot().profiles).toHaveLength(10);
  session.act({ action: 'create', browser: 'msedge' });
  await idle(session);
  expect(session.snapshot()).toMatchObject({ profileCount: 13, profilePage: 1 });
  expect(session.snapshot().profiles).toHaveLength(3);
  expect(store.save).toHaveBeenCalledTimes(1);
  expect(launch).not.toHaveBeenCalled();
  await session.close();
});
it('does not overwrite a corrupt profile registry', async () => {
  const { store, launch } = setup();
  store.load = async () => {
    throw new Error('corrupt');
  };
  const session = new FlowSession(store, launch, 'win32');
  await idle(session);
  expect(session.act({ action: 'create', browser: 'chrome' }).error).toBe('STORAGE_ERROR');
  expect(store.save).not.toHaveBeenCalled();
  await session.close();
});
it('clears observations when browser closes and sanitizes launch errors', async () => {
  const { session, browser, launch } = setup();
  await idle(session);
  session.act({ action: 'open', profileId: id });
  await idle(session);
  session.act({ action: 'observe' });
  await idle(session);
  await browser.close();
  expect(session.snapshot()).toMatchObject({
    browserOpen: false,
    observation: null,
    activeProfileId: null,
  });
  launch.mockRejectedValueOnce(new Error('secret path cookie=private'));
  session.act({ action: 'open', profileId: id });
  await idle(session);
  expect(session.snapshot().error).toBe('BROWSER_OPEN_FAILED');
  expect(JSON.stringify(session.snapshot())).not.toMatch(/secret|cookie|private/);
  await session.close();
});
it('closes a browser launched while the sidecar is shutting down', async () => {
  const { session, browser, launch } = setup();
  let complete!: (browser: FlowBrowser) => void;
  launch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  await idle(session);
  session.act({ action: 'open', profileId: id });
  const closing = session.close();
  complete(browser);
  await closing;
  expect(browser.close).toHaveBeenCalledTimes(1);
  expect(session.snapshot().browserOpen).toBe(false);
});
it('rejects arbitrary URL, path, shell and generation fields at the boundary', () => {
  for (const action of [
    { action: 'open', profileId: '../Default' },
    { action: 'open', profileId: id, url: 'https://evil.example' },
    { action: 'create', browser: 'custom.exe' },
    { action: 'submit', prompt: 'generate' },
  ])
    expect(flowActionSchema.safeParse(action).success).toBe(false);
  const { session } = setup();
  expect(
    flowSnapshotSchema.safeParse({ ...session.snapshot(), generationReady: true }).success,
  ).toBe(false);
});
