import { MAX_FRAME_BYTES } from '../../../src/contracts/sidecar';

/** LF-delimited UTF-8 JSON; bound buffered bytes before parsing untrusted input. */
export class FrameDecoder {
  private pending = Buffer.alloc(0);

  push(chunk: Buffer): string[] {
    const frames: string[] = [];
    let offset = 0;
    while (offset < chunk.length) {
      const newline = chunk.indexOf(10, offset);
      const end = newline < 0 ? chunk.length : newline;
      if (this.pending.length + end - offset > MAX_FRAME_BYTES) {
        this.pending = Buffer.alloc(0);
        throw new Error('FRAME_TOO_LARGE');
      }
      this.pending = Buffer.concat([this.pending, chunk.subarray(offset, end)]);
      if (newline < 0) return frames;
      frames.push(new TextDecoder('utf-8', { fatal: true }).decode(this.pending));
      this.pending = Buffer.alloc(0);
      offset = end + 1;
    }
    return frames;
  }

  end(): void {
    if (this.pending.length) throw new Error('INCOMPLETE_FRAME');
  }
}
