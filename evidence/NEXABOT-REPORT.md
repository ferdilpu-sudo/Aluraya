> ARSIP: integrasi ini dihapus pada ADR-016 (16 Oktober 2026). Bukan panduan runtime aktif; lihat [plan terbaru](../plan.md).

# Nexabot thin slice — 15 Oktober 2026

REQ-004/006/007/010, TASK-004/005. Provider diganti atas keputusan eksplisit pengguna setelah laporan WebView2 diblokir. Screenshot penolakan tidak tersedia untuk dibaca; laporan pengguna dicatat tanpa mengklaim inspeksi gambar.

Implementasi: key DPAPI, endpoint reseller yang didokumentasikan pengguna, saldo, approval snapshot sekali pakai, img/t2v, SQLite journal sebelumPOST, uncertain tanparesubmit, resume knownID, media stream/MIME/signature/hash/rename, scoped asset preview, UI koneksi/form/riwayat. Tidak ada API key nyata atau request berbayar dalam pengujian.

Pemeriksaan lokal awal npm run check PASS75tests +2Windows-only skipped; setelah penambahan runtime smoke, lint menemukan import timer yang hilang dan diperbaiki. Pemeriksaan akhir npm run check PASS: 75 tes, 2 DPAPI Windows-only skipped; format/lint/typecheck/UI+sidecar build PASS. Windows CI masih pending pada commit implementasi.

Tes risiko: double-submit, biaya berubah, approval usang, timeout-submit+restart, durable submitting→uncertain, key fingerprint, retry download tanpaPOST, redirect key leakage, status ID mismatch, response202rusak, mediaHTML, input asing, error redaction. WindowsDPAPI test disediakan. Native DTO tests menolak path traversal/secretfield/parameter privileged. Installed smoke menambah inisialisasiSQLite Nexabot tanpa key/network.

NOT RUN: live Nexabot credit/generate/refund/download aktual; GUIWindows dan asset preview aktual; validitas decode/kualitasAI; RAM; reference modes; actual redirecthost. M-001 belumPASS. Biaya aktual dicatat bila provider mengirim credit_cost; API tidak mempunyai batas charge atomik. Riwayat lokal tidak dianggap bukti refund.

Perbaikan timing: antrean UI tidak membuang klik saat inspect IPC berjalan; hanya inspect tambahan yang digabung. Dua tes antrean memverifikasi urutan dan kelanjutan setelah error. Pemeriksaan akhir lokal npm run check PASS77 tes +2 Windows-only skipped; total79 pada Windows.


## Build Windows final — PASS

Commit `57685d575a8b178bf9776de82cec45476ebafe36`, [run 38666298634](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38666298634), job116198914592. Npm check79/79PASS termasuk DPAPIWindows; Rust12PASS; NSIS/install/runtime/uninstall8checksPASS. Report aktual: [NEXABOT-INSTALLER.json](NEXABOT-INSTALLER.json), checkedAt2026-10-15T01:42:52.657Z.

[Installer artifact11942940371](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38666298634/artifacts/11942940371), aktif sampai13Januari2027 menurut metadataGitHub. Installer `Aluraya Studio_0.1.0_x64-setup.exe`, 25.711.904byte, SHA256 `e646c0a69ee767eb2468e866e9286cb7b09413fc94a213d305be7efeb3347818`. Hash executable terpasang `ce8a6213352dc5709c6cd3e5007728c931e91c73e419f42969d9035aa79defd3`. Artifact laporan11942895377.

Build PASS tidak membuktikan kredit/generasi/download live, previewGUI atau upgrade pada laptop pengguna. Langkah berikut: pasang paket, simpan key di aplikasi, cek saldo gratis. Kemudian satu gambar setelah approvalUI, verifikasi hasil otomatis ke canvas; video sebagai request berbiaya tersendiri. Tidak meminta key lewat chat.
