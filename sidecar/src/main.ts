import { once } from 'node:events';
import { FrameDecoder } from './transport/frames';
import { dispatch } from './dispatch';

async function main() {
  const decoder = new FrameDecoder();
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    for (const frame of decoder.push(buffer)) {
      const response = dispatch(frame) + '\n';
      if (!process.stdout.write(response)) await once(process.stdout, 'drain');
    }
  }
  decoder.end();
}

main().catch(() => {
  process.stderr.write('ALURAYA_PROTOCOL_ERROR\n');
  process.exitCode = 1;
  process.stdin.destroy();
});
