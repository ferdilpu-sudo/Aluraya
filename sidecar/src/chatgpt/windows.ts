import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { ChatError } from './errors';

// Fixed scripts only. Secret input travels through stdin, never command arguments.
function powershell(script: string, input: string): Promise<string> {
  if (process.platform !== 'win32') return Promise.reject(new ChatError('WINDOWS_REQUIRED'));
  const executable = join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );
  return new Promise((resolve, reject) => {
    const child = execFile(
      executable,
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-EncodedCommand',
        Buffer.from(script, 'utf16le').toString('base64'),
      ],
      {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 4 * 1048576,
      },
      (error, stdout) => (error ? reject(new ChatError('STORAGE_ERROR')) : resolve(stdout.trim())),
    );
    child.stdin?.on('error', () => {});
    child.stdin?.end(input);
  });
}
export async function protect(data: string): Promise<string> {
  return powershell(
    `$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd())
$result=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Out.Write([Convert]::ToBase64String($result))`,
    Buffer.from(data).toString('base64'),
  );
}
export async function unprotect(data: string): Promise<string> {
  const value = await powershell(
    `$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd())
$result=[Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Out.Write([Convert]::ToBase64String($result))`,
    data,
  );
  return Buffer.from(value, 'base64').toString('utf8');
}
export async function openProviderPage(address: string): Promise<void> {
  const url = new URL(address);
  const login =
    url.origin === 'https://auth.openai.com' && url.pathname === '/api/accounts/authorize';
  const usage = address === 'https://chatgpt.com/settings/usage';
  if ((!login && !usage) || url.username || url.password) throw new ChatError('ACCESS_DENIED');
  await powershell(
    `$ErrorActionPreference='Stop'
$url=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd()))
Start-Process -FilePath $url`,
    Buffer.from(address).toString('base64'),
  );
}
