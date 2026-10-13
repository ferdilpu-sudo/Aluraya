import { beforeEach, expect, it, vi } from 'vitest';
import { launchFlow } from '../sidecar/src/flow/browser';
const { launch } = vi.hoisted(() => ({ launch: vi.fn() }));
vi.mock('playwright-core', () => ({ chromium: { launchPersistentContext: launch } }));
beforeEach(() => {
  launch.mockReset();
});
function page(address: string) {
  return {
    url: () => address,
    isClosed: () => false,
    goto: vi.fn(async () => {}),
    evaluate: vi.fn(async () => ({ editorVisible: true, lines: ['Veo 3.1'] })),
  };
}
it('enables the browser sandbox and never retries a failed launch with weaker options', async () => {
  launch.mockRejectedValue(new Error('sandbox launch failed'));
  await expect(launchFlow('/dedicated/profile', 'chrome')).rejects.toThrow('sandbox launch failed');
  expect(launch).toHaveBeenCalledTimes(1);
  const options = launch.mock.calls[0]![1];
  expect(options.chromiumSandbox).toBe(true);
  expect(options.args).toBeUndefined();
  expect(options.ignoreDefaultArgs).toBeUndefined();
});
it('prioritizes a rejected sign-in popup over an old Flow tab without reading either DOM', async () => {
  const flow = page('https://labs.google/fx/tools/flow');
  const rejected = page('https://accounts.google.com/v3/signin/rejected?secret=fixture');
  const close = vi.fn(async () => {});
  launch.mockResolvedValue({ pages: () => [flow, rejected], close });
  const browser = await launchFlow('/dedicated/profile', 'chrome');
  const observation = await browser.observe();
  expect(observation).toMatchObject({
    page: 'login_rejected',
    editorVisible: false,
    modelLabels: [],
    creditLabels: [],
    costVerified: false,
  });
  expect(flow.evaluate).not.toHaveBeenCalled();
  expect(rejected.evaluate).not.toHaveBeenCalled();
  expect(JSON.stringify(observation)).not.toMatch(/secret|fixture|accounts/);
  await browser.close();
  expect(close).toHaveBeenCalledTimes(1);
});
