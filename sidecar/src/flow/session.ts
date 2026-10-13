import { randomUUID } from 'node:crypto';
import {
  flowSnapshotSchema,
  type FlowAction,
  type FlowSnapshot,
} from '../../../src/contracts/flow';
import { launchFlow, type FlowBrowser } from './browser';
import type { Profile, ProfileStore } from './profiles';

export class FlowSession {
  private profiles: Profile[] = [];
  private loaded = false;
  private browser: FlowBrowser | null = null;
  private closed = false;
  private running: Promise<void>;
  private state: FlowSnapshot = {
    schemaVersion: 1,
    activity: 'loading',
    profiles: [],
    profileCount: 0,
    profilePage: 0,
    activeProfileId: null,
    browserOpen: false,
    observation: null,
    generationReady: false,
    error: null,
  };
  constructor(
    private readonly store: ProfileStore,
    private readonly launch = launchFlow,
    private readonly platform = process.platform,
  ) {
    this.running = store
      .load()
      .then((profiles) => {
        this.profiles = profiles;
        this.loaded = true;
      })
      .catch(() => {
        this.state.error = 'STORAGE_ERROR';
      })
      .finally(() => {
        this.state.activity = 'idle';
      });
  }
  snapshot() {
    return flowSnapshotSchema.parse({
      ...this.state,
      profiles: this.profiles.slice(this.state.profilePage * 10, this.state.profilePage * 10 + 10),
      profileCount: this.profiles.length,
    });
  }
  private work(
    activity: FlowSnapshot['activity'],
    work: () => Promise<void>,
    failure: NonNullable<FlowSnapshot['error']>,
  ) {
    this.state.activity = activity;
    this.state.error = null;
    this.state.observation = null;
    this.running = work()
      .catch((error) => {
        this.state.error =
          error instanceof Error && error.message === 'NAVIGATION_FAILED'
            ? 'NAVIGATION_FAILED'
            : failure;
      })
      .finally(() => {
        this.state.activity = 'idle';
      });
  }
  act(action: FlowAction): FlowSnapshot {
    if (action.action === 'inspect') return this.snapshot();
    if (this.closed) return { ...this.snapshot(), error: 'BROWSER_CLOSED' };
    if (this.state.activity !== 'idle') return { ...this.snapshot(), error: 'BUSY' };
    if (!this.loaded) return { ...this.snapshot(), error: 'STORAGE_ERROR' };
    if (this.platform !== 'win32') return { ...this.snapshot(), error: 'WINDOWS_REQUIRED' };
    switch (action.action) {
      case 'profiles':
        this.state.profilePage = Math.min(
          action.page,
          Math.max(0, Math.ceil(this.profiles.length / 10) - 1),
        );
        break;
      case 'create':
        this.work(
          'loading',
          async () => {
            const profiles = [...this.profiles, { id: randomUUID(), browser: action.browser }];
            await this.store.save(profiles);
            this.profiles = profiles;
            this.state.profilePage = Math.floor((profiles.length - 1) / 10);
          },
          'STORAGE_ERROR',
        );
        break;
      case 'open': {
        if (this.browser) return { ...this.snapshot(), error: 'PROFILE_ACTIVE' };
        const profile = this.profiles.find((item) => item.id === action.profileId);
        if (!profile) return { ...this.snapshot(), error: 'PROFILE_NOT_FOUND' };
        this.work(
          'opening',
          async () => {
            const browser = await this.launch(this.store.directory(profile.id), profile.browser);
            if (this.closed) {
              await browser.close();
              return;
            }
            this.browser = browser;
            this.state.activeProfileId = profile.id;
            this.state.browserOpen = true;
            browser.onClose(() => {
              if (this.browser !== browser) return;
              this.browser = null;
              this.state.browserOpen = false;
              this.state.activeProfileId = null;
              this.state.observation = null;
            });
          },
          'BROWSER_OPEN_FAILED',
        );
        break;
      }
      case 'observe': {
        const browser = this.browser;
        if (!browser) return { ...this.snapshot(), error: 'BROWSER_CLOSED' };
        this.work(
          'observing',
          async () => {
            const observation = await browser.observe();
            if (this.browser === browser) this.state.observation = observation;
          },
          'OBSERVATION_FAILED',
        );
        break;
      }
      case 'close':
        this.work(
          'closing',
          async () => {
            await this.browser?.close();
            this.browser = null;
            this.state.browserOpen = false;
            this.state.activeProfileId = null;
          },
          'BROWSER_CLOSED',
        );
    }
    return this.snapshot();
  }
  async close() {
    this.closed = true;
    await this.running;
    await this.browser?.close().catch(() => {});
  }
}
