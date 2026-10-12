import { expect, it } from 'vitest';
import { inspectRuntime } from '../src/application/diagnostics';

it('a browser preview cannot report a connected desktop or provider', async () => {
  const report = await inspectRuntime();
  expect(report.runtime).toBe('browser');
  expect(report.checks.some((check) => check.state === 'pass')).toBe(false);
});
