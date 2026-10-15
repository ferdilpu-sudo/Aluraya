import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core';
import { z } from 'zod';
import { nexaActionSchema, nexaSnapshotSchema, type NexaAction } from '../contracts/nexabot';
const resultSchema = z
  .object({ snapshot: nexaSnapshotSchema, mediaRoot: z.string().min(1).max(4096) })
  .strict();
export async function nexabotAction(action: NexaAction) {
  if (!isTauri()) throw new Error('DESKTOP_REQUIRED');
  const result = resultSchema.parse(
    await invoke('nexabot_action', { action: nexaActionSchema.parse(action) }),
  );
  return {
    ...result.snapshot,
    jobs: result.snapshot.jobs.map((job) => ({
      ...job,
      previewUrl: job.media ? convertFileSrc(`${result.mediaRoot}/${job.media.fileName}`) : null,
    })),
  };
}
export type NexaView = Awaited<ReturnType<typeof nexabotAction>>;
