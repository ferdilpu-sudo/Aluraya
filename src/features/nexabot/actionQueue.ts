import type { NexaAction } from '../../contracts/nexabot';

// Inspections may be coalesced; explicit user actions must never be dropped.
export class NexaActionQueue<T> {
  private tail: Promise<unknown> = Promise.resolve();
  private queued = 0;
  pending = 0;
  constructor(private readonly request: (action: NexaAction) => Promise<T>) {}
  run(action: NexaAction): Promise<T | null> {
    const inspecting = action.action === 'inspect';
    if (inspecting && this.queued > 0) return Promise.resolve(null);
    this.queued++;
    if (!inspecting) this.pending++;
    const task = this.tail
      .then(() => this.request(action))
      .finally(() => {
        this.queued--;
        if (!inspecting) this.pending--;
      });
    this.tail = task.catch(() => {});
    return task;
  }
}
