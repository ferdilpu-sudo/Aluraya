import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

// This installs/uninstalls only in a disposable hosted Windows CI runner.
if (process.platform !== 'win32' || process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('Run this installer check only in disposable Windows GitHub Actions CI.');
}
const root = process.cwd();
const output = resolve('evidence/local/installer-check.json');
const installDirectory = await mkdtemp(join(tmpdir(), 'Aluraya Installer QA-'));
const environment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !/^(NODE_OPTIONS|NODE_PATH|ALURAYA_AUTH_DIR|ALURAYA_FLOW_DIR)$/i.test(key),
  ),
);
const report = {
  schemaVersion: 1,
  sourceCommit: process.env.GITHUB_SHA,
  checkedAt: new Date().toISOString(),
  status: 'FAIL',
  checks: [],
  limits: 'No GUI, provider login, generation, upgrade or Windows LTSC verification.',
};
function run(file, args, { input, nsis = false, timeout = 30000 } = {}) {
  return new Promise((resolveResult, reject) => {
    const child = execFile(
      file,
      args,
      {
        cwd: installDirectory,
        env: environment,
        timeout,
        maxBuffer: 65536,
        windowsHide: true,
        // NSIS requires its final /D= or _?= path unquoted, including spaces.
        windowsVerbatimArguments: nsis,
      },
      (error, stdout) => (error ? reject(error) : resolveResult(stdout)),
    );
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
async function hash(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}
async function same(source, target) {
  if ((await hash(source)) !== (await hash(target)))
    throw new Error(`PACKAGED_FILE_MISMATCH: ${target}`);
}
async function compareTree(source, target) {
  const entries = await readdir(source, { withFileTypes: true });
  const installed = await readdir(target);
  if (installed.length !== entries.length) throw new Error('PACKAGED_DIRECTORY_MISMATCH');
  let files = 0;
  for (const entry of entries) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) files += await compareTree(from, to);
    else if (entry.isFile()) {
      await same(from, to);
      files++;
    } else throw new Error('UNEXPECTED_PACKAGE_LINK');
  }
  return files;
}
async function exists(path) {
  return access(path).then(
    () => true,
    () => false,
  );
}
let failure;
try {
  const directory = resolve('src-tauri/target/release/bundle/nsis');
  const names = (await readdir(directory)).filter((name) => name.endsWith('-setup.exe'));
  if (names.length !== 1) throw new Error('EXPECTED_ONE_INSTALLER');
  const installer = join(directory, names[0]);
  report.installer = {
    name: basename(installer),
    bytes: (await stat(installer)).size,
    sha256: await hash(installer),
  };
  await run(installer, ['/S', `/D=${installDirectory}`], { nsis: true, timeout: 180000 });
  report.checks.push('silent_install');
  const mappings = [
    ['src-tauri/target/release/aluraya.exe', 'aluraya.exe'],
    ['src-tauri/binaries/aluraya-node-x86_64-pc-windows-msvc.exe', 'aluraya-node.exe'],
    ['src-tauri/resources/sidecar.cjs', 'sidecar/sidecar.cjs'],
    ['src-tauri/resources/runtime.json', 'sidecar/runtime.json'],
    ['src-tauri/resources/NODE-LICENSE.txt', 'licenses/NODE-LICENSE.txt'],
    ['public/THIRD-PARTY-NOTICES.txt', 'licenses/THIRD-PARTY-NOTICES.txt'],
  ];
  for (const [source, target] of mappings)
    await same(join(root, source), join(installDirectory, target));
  report.playwrightFiles = await compareTree(
    join(root, 'src-tauri/resources/node_modules/playwright-core'),
    join(installDirectory, 'sidecar/node_modules/playwright-core'),
  );
  report.checks.push('installed_files_match_build');
  const runtime = JSON.parse(
    await readFile(join(installDirectory, 'sidecar/runtime.json'), 'utf8'),
  );
  const executable = join(installDirectory, 'aluraya-node.exe');
  if (runtime.sha256 !== (await hash(executable))) throw new Error('NODE_HASH_MISMATCH');
  report.checks.push('bundled_node_hash');
  const requestId = randomUUID();
  const response = JSON.parse(
    await run(executable, [join(installDirectory, 'sidecar/sidecar.cjs')], {
      input:
        JSON.stringify({ schemaVersion: 1, requestId, type: 'health.inspect', payload: {} }) + '\n',
    }),
  );
  if (
    response.schemaVersion !== 1 ||
    response.requestId !== requestId ||
    response.ok !== true ||
    response.payload?.platform !== 'win32' ||
    response.payload?.nodeVersion !== runtime.node ||
    response.payload?.checks?.find((check) => check.id === 'sidecar')?.state !== 'pass'
  ) {
    throw new Error('INSTALLED_SIDECAR_PROTOCOL_FAILED');
  }
  report.checks.push('installed_sidecar_round_trip_and_clean_exit');
} catch (error) {
  failure = error;
}
try {
  const uninstaller = join(installDirectory, 'uninstall.exe');
  if (!(await exists(uninstaller))) throw new Error('INSTALLED_UNINSTALLER_MISSING');
  await run(uninstaller, ['/S', `_?=${installDirectory}`], { nsis: true, timeout: 90000 });
  for (const file of ['aluraya.exe', 'aluraya-node.exe', 'sidecar/sidecar.cjs']) {
    if (await exists(join(installDirectory, file))) throw new Error('UNINSTALL_LEFT_RUNTIME_FILES');
  }
  report.checks.push('silent_uninstall_removes_runtime');
} catch (error) {
  failure ??= error;
  report.uninstallFailed = true;
}
if (!failure) report.status = 'PASS';
else report.error = failure.message;
await mkdir(resolve('evidence/local'), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (failure) process.exitCode = 1;
