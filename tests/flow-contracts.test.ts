import { expect, it } from 'vitest';
import { flowActionSchema, flowSnapshotSchema } from '../src/contracts/flow';
import { dispatch } from '../sidecar/src/dispatch';
import { flowError } from '../src/features/flow/flowErrors';

it('native Flow accepts only bounded commands and rejects legacy launch and privileged input', () => {
  for (const action of ['create', 'inspect', 'observe', 'close']) {
    expect(flowActionSchema.safeParse({ action }).success).toBe(true);
    for (const key of ['browser', 'path', 'cookie', 'url', 'script', 'approved'])
      expect(flowActionSchema.safeParse({ action, [key]: 'foreign-input' }).success).toBe(false);
  }
  expect(flowActionSchema.safeParse({ action: 'open', profileId: '../Default' }).success).toBe(
    false,
  );
  expect(flowActionSchema.safeParse({ action: 'profiles', page: -1 }).success).toBe(false);
  expect(flowActionSchema.safeParse({ action: 'submit' }).success).toBe(false);
});
it('navigation observations never authorize generation or claim account verification', () => {
  const value = {
    schemaVersion: 2,
    runtime: 'webview2',
    profiles: [],
    profileCount: 0,
    profilePage: 0,
    activeProfileId: null,
    browserOpen: false,
    observation: null,
    generationReady: false,
    error: null,
  };
  expect(flowSnapshotSchema.safeParse(value).success).toBe(true);
  expect(flowSnapshotSchema.safeParse({ ...value, generationReady: true }).success).toBe(false);
  expect(flowSnapshotSchema.safeParse({ ...value, schemaVersion: 1 }).success).toBe(false);
  expect(flowSnapshotSchema.safeParse({ ...value, signedIn: true }).success).toBe(false);
});
it('sidecar can no longer launch a parallel Flow browser', () => {
  expect(() =>
    dispatch(
      JSON.stringify({
        schemaVersion: 1,
        requestId: '38d0587b-17b4-4abc-a6c2-c23aabdaae8d',
        type: 'flow.action',
        payload: { action: 'inspect' },
      }),
    ),
  ).toThrow();
});
it('unknown native errors cannot disclose profile paths or auth URLs', () => {
  expect(flowError('https://accounts.google.com/?token=secret')).not.toContain('secret');
  expect(flowError('PROFILE_IN_USE')).toContain('Aluraya lain');
});
