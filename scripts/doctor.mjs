import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const results = [];
function check(id, pass, detail) {
  results.push({ id, status: pass ? 'PASS' : 'BLOCKED', detail });
}
function commandVersion(name, args = ['--version']) {
  const value = spawnSync(name, args, { encoding: 'utf8', timeout: 8000, windowsHide: true });
  return value.status === 0 ? value.stdout.trim().slice(0, 160) : null;
}
check(
  'windows-x64',
  process.platform === 'win32' && process.arch === 'x64',
  `${process.platform}/${process.arch}`,
);
check('node-24', Number(process.versions.node.split('.')[0]) === 24, process.version);
for (const name of ['cargo', 'rustc']) {
  const version = commandVersion(name);
  check(name, !!version, version ?? 'Install Rust stable and Windows C++ Build Tools.');
}
check('dependencies', existsSync('node_modules/.package-lock.json'), 'Run npm ci before building.');
check('sidecar', existsSync('sidecar/dist/main.cjs'), 'Run npm run sidecar:build.');
if (process.platform === 'win32') {
  const browser = [
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    process.env.LOCALAPPDATA,
  ]
    .filter(Boolean)
    .some((root) =>
      ['Microsoft/Edge/Application/msedge.exe', 'Google/Chrome/Application/chrome.exe'].some(
        (suffix) => existsSync(join(root, suffix)),
      ),
    );
  check(
    'browser-candidate',
    browser,
    'Installed browser is a candidate only; Flow compatibility remains NOT RUN.',
  );
  const webview = commandVersion('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    "$roots = @('HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\*','HKLM:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\*','HKCU:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\*'); Get-ItemProperty $roots -ErrorAction SilentlyContinue | Where-Object { $_.name -like '*WebView2*' } | Select-Object -ExpandProperty pv -Unique",
  ]);
  check(
    'webview2',
    !!webview,
    webview || 'WebView2 not detected; verify/install Microsoft Evergreen Runtime.',
  );
}
const output = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  checks: results,
  liveGate: 'NOT RUN: Windows startup, OAuth, Flow and process-tree memory need the user device.',
};
console.log(JSON.stringify(output, null, 2));
process.exitCode = results.some((item) => item.status === 'BLOCKED') ? 2 : 0;
