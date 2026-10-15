import { createHash, randomUUID } from 'node:crypto';
import { open, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { type NexaMedia } from '../../../src/contracts/nexabot';
import { NexaError } from './errors';

export async function collectMedia(
  response: Response,
  directory: string,
  mode: 'img' | 't2v',
): Promise<NexaMedia> {
  const mime = mode === 'img' ? 'image/jpeg' : 'video/mp4';
  const extension = mode === 'img' ? 'jpg' : 'mp4';
  const type = response.headers.get('content-type')?.split(';')[0]?.trim();
  if (type !== mime && type !== 'application/octet-stream') {
    await response.body?.cancel();
    throw new NexaError('MEDIA_INVALID');
  }
  const maximum = mode === 'img' ? 25 * 1048576 : 256 * 1048576;
  if (Number(response.headers.get('content-length')) > maximum || !response.body) {
    await response.body?.cancel();
    throw new NexaError('MEDIA_INVALID');
  }
  const fileName = `${randomUUID()}.${extension}`;
  const target = join(directory, 'media', fileName);
  const temporary = `${target}.part`;
  const hash = createHash('sha256');
  let bytes = 0;
  let header = Buffer.alloc(0);
  const reader = response.body.getReader();
  try {
    const file = await open(temporary, 'wx', 0o600);
    try {
      for (;;) {
        const item = await reader.read();
        if (item.done) break;
        const chunk = Buffer.from(item.value);
        bytes += chunk.length;
        if (bytes > maximum) throw new NexaError('MEDIA_INVALID');
        if (header.length < 16)
          header = Buffer.concat([header, chunk.subarray(0, 16 - header.length)]);
        hash.update(chunk);
        await file.writeFile(chunk);
      }
      const signature =
        mode === 'img'
          ? header.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
          : header.subarray(4, 8).toString() === 'ftyp';
      if (!signature || bytes < 16) throw new NexaError('MEDIA_INVALID');
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, target);
    return { fileName, sha256: hash.digest('hex'), bytes, mime };
  } finally {
    await reader.cancel().catch(() => {});
    await unlink(temporary).catch(() => {});
  }
}
