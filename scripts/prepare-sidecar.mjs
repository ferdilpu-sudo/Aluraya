import { copyFile, mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

// Package the developer's installed runtime; hash it for later verification.
if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('Packaging requires Windows x64. Use npm run build for UI/sidecar checks.');
}
if (Number(process.versions.node.split('.')[0]) !== 24) {
  throw new Error('Use Node.js 24 LTS x64 for the bundled runtime.');
}
const runtimeName = 'aluraya-node-x86_64-pc-windows-msvc.exe';
await mkdir('src-tauri/binaries', { recursive: true });
await mkdir('src-tauri/resources', { recursive: true });
await copyFile(process.execPath, join('src-tauri/binaries', runtimeName));
await copyFile('sidecar/dist/main.cjs', 'src-tauri/resources/sidecar.cjs');
const licensePath = join(dirname(process.execPath), 'LICENSE');
try {
  await copyFile(licensePath, 'src-tauri/resources/NODE-LICENSE.txt');
} catch {
  throw new Error(
    'Node LICENSE missing beside node.exe. Use the official Node 24 x64 ZIP distribution.',
  );
}
const bytes = await readFile(process.execPath);
await writeFile(
  'src-tauri/resources/runtime.json',
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    null,
    2,
  ),
);
console.log('Windows sidecar prepared with Node runtime and license.');
