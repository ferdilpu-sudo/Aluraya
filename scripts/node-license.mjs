import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Buffer } from 'node:buffer';

const MAX_LICENSE_BYTES = 2_000_000;

function validateLicense(bytes) {
  const text = bytes.toString('utf8');
  if (
    bytes.length > MAX_LICENSE_BYTES ||
    !text.includes('Node.js') ||
    !text.includes('Permission is hereby granted') ||
    text.trimStart().startsWith('<')
  ) {
    throw new Error('File is not a recognized Node.js license text.');
  }
  return text;
}

async function localLicense(path) {
  try {
    return validateLicense(await readFile(path));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function downloadLicense(url, fetcher) {
  const response = await fetcher(url, {
    signal: globalThis.AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok || !response.body) throw new Error(`License download HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_LICENSE_BYTES) throw new Error('Node license response exceeds size limit.');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  return validateLicense(Buffer.concat(chunks));
}

/** Resolve only the running Node release's license; never silently omit it from a bundle. */
export async function resolveNodeLicense({
  executable,
  version,
  cacheDirectory,
  explicitPath,
  fetcher = globalThis.fetch,
}) {
  if (!/^v24\.\d+\.\d+$/.test(version)) throw new Error('A stable Node 24 version is required.');
  if (explicitPath) {
    const text = await localLicense(explicitPath);
    if (!text) throw new Error('ALURAYA_NODE_LICENSE_FILE does not exist.');
    return { text, source: 'explicit-file', version };
  }
  for (const name of ['LICENSE', 'LICENSE.txt', 'license.txt', 'LICENSE.md']) {
    const text = await localLicense(join(dirname(executable), name));
    if (text) return { text, source: `local:${name}`, version };
  }
  const cachePath = join(cacheDirectory, `${version}.txt`);
  const cached = await localLicense(cachePath);
  if (cached) return { text: cached, source: 'version-cache', version };
  const url = `https://raw.githubusercontent.com/nodejs/node/${version}/LICENSE`;
  let text;
  try {
    text = await downloadLicense(url, fetcher);
  } catch (cause) {
    throw new Error(
      `Cannot obtain the official Node ${version} license. Check internet access or set ` +
        'ALURAYA_NODE_LICENSE_FILE to the complete LICENSE for this Node version.',
      { cause },
    );
  }
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(`${cachePath}.tmp`, text, 'utf8');
  await rename(`${cachePath}.tmp`, cachePath);
  return { text, source: url, version };
}
