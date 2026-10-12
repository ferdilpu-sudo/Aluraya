import { copyFile, mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { resolveNodeLicense } from './node-license.mjs';

// Package the developer's installed runtime; hash it for later verification.
if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('Packaging requires Windows x64. Use npm run build for UI/sidecar checks.');
}
if (Number(process.versions.node.split('.')[0]) !== 24) {
  throw new Error('Use Node.js 24 LTS x64 for the bundled runtime.');
}
const runtimeName = 'aluraya-node-x86_64-pc-windows-msvc.exe';
// Resolve before mutating bundled files so a missing license fails before packaging.
const license = await resolveNodeLicense({
  executable: process.execPath,
  version: process.version,
  cacheDirectory: 'src-tauri/resources/node-licenses',
  explicitPath: process.env.ALURAYA_NODE_LICENSE_FILE,
});
await mkdir('src-tauri/binaries', { recursive: true });
await mkdir('src-tauri/resources', { recursive: true });
await copyFile(process.execPath, join('src-tauri/binaries', runtimeName));
await copyFile('sidecar/dist/main.cjs', 'src-tauri/resources/sidecar.cjs');
await writeFile('src-tauri/resources/NODE-LICENSE.txt', license.text, 'utf8');
const bytes = await readFile(process.execPath);
await writeFile(
  'src-tauri/resources/runtime.json',
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      license: {
        version: license.version,
        source: license.source,
        sha256: createHash('sha256').update(license.text).digest('hex'),
      },
    },
    null,
    2,
  ),
);
console.log('Windows sidecar prepared with Node runtime and license.');
