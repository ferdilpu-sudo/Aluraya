import { chromium, type BrowserContext } from 'playwright-core';
import { FLOW_URL, observedLabels, pageKind } from './observation';
import type { FlowObservation } from '../../../src/contracts/flow';

export interface FlowBrowser {
  observe(): Promise<FlowObservation>;
  close(): Promise<void>;
  onClose(callback: () => void): void;
}
export async function launchFlow(
  directory: string,
  channel: 'chrome' | 'msedge',
): Promise<FlowBrowser> {
  // Playwright uses its standard pipe transport. No external debugging port,
  // imported default profile, stealth flags or script injection at sign-in.
  const context: BrowserContext = await chromium.launchPersistentContext(directory, {
    channel,
    chromiumSandbox: true,
    headless: false,
    viewport: null,
    acceptDownloads: false,
    timeout: 30000,
  });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch {
    await context.close().catch(() => {});
    throw new Error('NAVIGATION_FAILED');
  }
  return {
    close: () => context.close(),
    onClose: (callback) => context.on('close', callback),
    async observe() {
      const pages = context.pages().filter((page) => !page.isClosed());
      const page =
        pages.find((page) => pageKind(page.url()) === 'login_rejected') ??
        pages.find((page) => pageKind(page.url()) === 'flow') ??
        pages.at(-1);
      const kind = page ? pageKind(page.url()) : 'closed';
      const empty: FlowObservation = {
        observedAt: new Date().toISOString(),
        page: kind,
        editorVisible: false,
        modelLabels: [],
        creditLabels: [],
        costVerified: false,
      };
      if (!page || kind !== 'flow') return empty;
      // Recheck the origin inside evaluate to avoid observing a sign-in page
      // if navigation races with the precheck. No input values are read.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const visible = await Promise.race([
        page.evaluate(() => {
          const allowed =
            location.protocol === 'https:' &&
            !location.port &&
            (location.hostname === 'flow.google' ||
              (location.hostname === 'labs.google' &&
                /^\/fx\/(?:[a-z-]+\/)?tools\/flow(?:\/|$)/.test(location.pathname)));
          if (!allowed) return null;
          const shown = (element: Element) =>
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden';
          const editorVisible = [
            ...document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'),
          ].some(shown);
          const lines = [
            ...document.querySelectorAll(
              'button, [role="option"], [role="combobox"], span, p, div',
            ),
          ]
            .slice(0, 5000)
            .filter(
              (element) =>
                shown(element) &&
                !element.closest('textarea, input, [contenteditable], [role="textbox"]') &&
                !element.querySelector('textarea, input, [contenteditable], [role="textbox"]'),
            )
            .filter(
              (element) =>
                element.children.length === 0 ||
                element.matches('button, [role="option"], [role="combobox"]'),
            )
            .map((element) => (element.textContent ?? '').trim())
            .filter((text) => text.length > 0 && text.length <= 100)
            .slice(0, 1000);
          return { editorVisible, lines };
        }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('OBSERVATION_FAILED')), 10000);
        }),
      ]).finally(() => clearTimeout(timer));
      const currentKind = pageKind(page.url());
      if (!visible || currentKind !== 'flow')
        return { ...empty, page: currentKind === 'flow' ? 'other' : currentKind };
      return { ...empty, editorVisible: visible.editorVisible, ...observedLabels(visible.lines) };
    },
  };
}
