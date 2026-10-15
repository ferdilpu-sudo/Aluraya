import { expect, it } from 'vitest';
import { NexaActionQueue } from '../src/features/nexabot/actionQueue';

it('retains explicit clicks during an in-flight inspection and coalesces only inspections', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls: string[] = [];
  const queue = new NexaActionQueue(async (action) => {
    calls.push(action.action);
    if (action.action === 'inspect') await gate;
    return action.action;
  });
  const inspect = queue.run({ action: 'inspect' });
  const save = queue.run({ action: 'save_key', key: 'nxb_test_fixture_no_real_key' });
  const credit = queue.run({ action: 'credit' });
  expect(await queue.run({ action: 'inspect' })).toBeNull();
  expect(queue.pending).toBe(2);
  release();
  expect(await Promise.all([inspect, save, credit])).toEqual(['inspect', 'save_key', 'credit']);
  expect(calls).toEqual(['inspect', 'save_key', 'credit']);
  expect(queue.pending).toBe(0);
});
it('a failed request does not discard the next user action', async () => {
  const queue = new NexaActionQueue(async (action) => {
    if (action.action === 'inspect') throw new Error('BUSY');
    return action.action;
  });
  const failed = queue.run({ action: 'inspect' });
  const next = queue.run({ action: 'credit' });
  await expect(failed).rejects.toThrow('BUSY');
  expect(await next).toBe('credit');
  expect(queue.pending).toBe(0);
});
