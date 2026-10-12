import { invoke, isTauri } from '@tauri-apps/api/core';
import { diagnosticsSchema, type Diagnostics } from '../contracts/diagnostics';

// Browser preview reports its real limitation; it never simulates a connected host.
export async function inspectRuntime(): Promise<Diagnostics> {
  if (isTauri()) {
    return diagnosticsSchema.parse(await invoke<unknown>('inspect_runtime'));
  }
  return diagnosticsSchema.parse({
    schemaVersion: 1,
    runtime: 'browser',
    platform: 'browser',
    nodeVersion: null,
    checkedAt: new Date().toISOString(),
    checks: [
      {
        id: 'host',
        label: 'Aplikasi Windows',
        state: 'not_run',
        detail: 'Pratinjau browser. Buka versi desktop untuk memeriksa host Tauri.',
      },
      {
        id: 'sidecar',
        label: 'Sidecar',
        state: 'not_run',
        detail: 'Sidecar hanya berjalan melalui host desktop.',
      },
      {
        id: 'chatgpt',
        label: 'ChatGPT',
        state: 'blocked',
        detail: 'Adapter OAuth belum diimplementasikan. Login dan penggunaan kuota belum diuji.',
      },
      {
        id: 'flow',
        label: 'Google Flow',
        state: 'blocked',
        detail: 'Adapter browser belum diimplementasikan. Akun, model, dan saldo belum diketahui.',
      },
      {
        id: 'generation',
        label: 'Generasi',
        state: 'blocked',
        detail: 'Menunggu integrasi, biaya terverifikasi, dan persetujuan batch.',
      },
    ],
  });
}
