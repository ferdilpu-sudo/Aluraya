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
          'Adapter OAuth belum diimplementasikan. Login, izin kuota dan streaming belum diuji.',
      },
      {
        id: 'flow',
        label: 'Google Flow',
        state: 'blocked',
        detail: 'Adapter browser belum diimplementasikan. Saldo dan capability belum diketahui.',
      },
      {
        id: 'generation',
        label: 'Generasi',
        state: 'blocked',
        detail:
          'Submit tidak tersedia. Menunggu provider, biaya terverifikasi dan persetujuan batch.',
      },
    ],
  });
}
