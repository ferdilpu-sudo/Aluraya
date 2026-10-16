import { diagnosticsSchema, type Diagnostics } from '../../src/contracts/diagnostics';

export function inspectHealth(): Diagnostics {
  return diagnosticsSchema.parse({
    schemaVersion: 1,
    runtime: 'desktop',
    checkedAt: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    checks: [
      {
        id: 'host',
        label: 'Aplikasi Windows',
        state: 'not_run',
        detail: 'Status host ditetapkan oleh Tauri setelah round-trip tervalidasi.',
      },
      {
        id: 'sidecar',
        label: 'Sidecar',
        state: 'pass',
        detail:
          'Proses Node aktif dan protokol diagnostik merespons. Ini bukan bukti koneksi provider.',
      },
      {
        id: 'chatgpt',
        label: 'ChatGPT',
        state: 'blocked',
        detail:
          'Status akun diperiksa melalui panel ChatGPT; belum ada sesi aktif pada diagnostik ini.',
      },
      {
        id: 'providers',
        label: 'API provider',
        state: 'blocked',
        detail: 'Konfigurasi provider belum membuktikan akses API. Eksekutor belum tersambung.',
      },
      {
        id: 'generation',
        label: 'Generasi',
        state: 'blocked',
        detail: 'Generasi menunggu adapter API, kemampuan model, biaya, dan persetujuan.',
      },
    ],
  });
}
