# Canvas awal dan skema API — 16 Oktober 2026

## Scope
Permintaan pengguna ADR-016: kembali ke plan awal, hapus Nexabot, sediakan skema API yang dapat disesuaikan. UI utama kembali canvas naskah/aset → storyboard → hasil dengan Copilot kanan. Editor manual berada pada Detail. Draf IndexedDB v1 dipertahankan tanpa migrasi destruktif.

Nexabot dihapus dari UI, TypeScript/Rust contracts, sidecar, invoke handler, capability, asset protocol dan pemeriksaan runtime khusus. Tes penolakan command lama ditambahkan. Dokumen dan bukti historis tetap arsip; file output/key lama pada mesin pengguna tidak disentuh. Flow tetap tidak aktif.

Config provider v1 memisahkan llm/image/video; endpoint/model/protocol, auth secretRef, declaredCapabilities, cost, custom input/output mapping dan polling. UI edit/routing/import/export menyimpan konfigurasi nonrahasia. Schema valid bukan koneksi terverifikasi. Tidak ada executor generik, input API key, request provider atau pengeluaran live.

## Verifikasi source
- PASS `npm run check`: format, ESLint, 81 tes JavaScript + 1 Windows-only SKIP (82 total, 13 files), typecheck, Vite build, sidecar build.
- PASS `git diff --check` setelah normalisasi newline modul Rust.
- Tes tambahan: schema example/default; unknown secret/verified fields; route role/duplicate IDs; credential/insecure/invalid URL; endpoint escapes; chat/media mismatch; async polling/status; graph referensi dan slot output tanpa hasil palsu. Tes draf lama tetap PASS.
- Warning build: bundle JS sekitar 543 KB (167 KB gzip), di atas advisory 500 KB. Tidak mengklaim benchmark atau optimasi RAM.
- Native Windows/installer versi ini: menunggu CI setelah push; bukti installer d31890d tidak digunakan sebagai bukti versi ini.
- NOT RUN visual browser/GUI Windows: browser runtime tidak tersedia pada lingkungan kerja; tidak ada screenshot hasil verifikasi.
- NOT RUN live API, planner/proposal, produksi media, biaya, upload/download dan hasil nyata. Fitur tersebut belum diimplementasikan di jalur API generik.

## Langkah berikut
Satu adapter LLM yang dipilih pengguna: secure key native → test connection eksplisit → proposal terstruktur → review/apply. Setelah itu media adapter dengan capability/quote dan approval konkret, jurnal tahan restart serta pengaitan hasil per shot. REQ-001/003/004 frontend PARTIAL; REQ-002/007 API config-only; M-001 belum lulus.
