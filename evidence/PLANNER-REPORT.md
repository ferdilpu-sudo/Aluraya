# PLAN-001 partial — usulan aset/shot dan review canvas

16 Oktober 2026. Melanjutkan ADR-016/017 sesuai arahan pengguna, dengan ADR-018. REQ-001/003/004 (draf aset/storyboard), REQ-002 (Copilot API) dan bagian proposal/approval M-003. REQ-016 compiler, media dan approval produksi belum selesai.

## Perubahan
- Sumber ide/cuplikan/lengkap eksplisit; naskah dan metadata teks masuk pesan hanya lewat tindakan pengguna. Tidak ada gambar/secret yang ditambahkan oleh planner.
- JSON strict, requestId berasal sidecar, respons complete wajib. Review menampilkan semua field dan meminta tindakan eksplisit sebelum append draf.
- Revisi proyek, referensi, dialog preserve, batas kapasitas dan receipt dicek ulang saat apply. UUID/ref dibentuk aplikasi; input lama tidak ditimpa; shot baru tetap draft. Semua edit menginvalidasi proposal lama, termasuk tata letak.
- Receipt ikut IndexedDB/backup. Draf v1 lama tetap valid dengan default revision=0 dan planReceipts=[]. Usulan tertunda hanya sesi.
- IPC reply diperbarui serentak TS/sidecar/Rust dengan correlation requestId; error transport tidak disembunyikan polling sukses setelah kemungkinan kehilangan request.

## Verifikasi
- PASS `npm run check`: Prettier, ESLint, 97 tes JavaScript PASS + 2 Windows-only SKIP (99 total, 18 file), TypeScript, Vite dan bundle sidecar.
- PASS fixture planner: malformed/privileged fields, refs tidak valid/duplikat, respons terpotong/asing, sumber tidak cocok, preserve-dialogue, stale edit/pindah proyek, append/ref mapping, double click/replay, old draft/reload/import.
- PASS lifecycle LLM: reply berkorelasi approval.id, satu POST fixture lokal. Tidak ada provider eksternal dipanggil.
- PASS `git diff --check` (sebelum push).
- Build JS 566.31 kB / 174.44 kB gzip; warning chunk >500 kB tetap ada, bukan pengukuran RAM.
- CI Windows untuk commit planner: menunggu push/build. Tes native correlation, DPAPI, NSIS dan installed runtime/uninstall menjadi gate CI; build API-002 sebelumnya lulus di run 38868964377.
- NOT RUN GUI/keyboard Windows, API key/model pengguna, kualitas proposal/continuity dan billing nyata. Tidak ada generasi atau biaya provider dari coding agent.

## Batas dan berikutnya
PLAN-001/M-003 PARTIAL. Apply draf dalam renderer lokal bukan approval keamanan produksi; approval provider tetap native/sidecar satu request. Tidak ada mock sukses provider di UI. Masih perlu compiler REQ-016 (empat jenis prompt, manifest referensi/lint), snapshot skill/approval native produksi, proposal persisten dan partial diff. Adapter media serta jurnal produksi tetap terpisah. [Panduan](../docs/PLANNER-START.md).
