# Pemulihan baseline asli — 17 Oktober 2026

## Instruksi dan hasil
Pengguna meminta kembali ke rencana awal, mengabaikan implementasi menyimpang, membersihkan Git, dan memakai baseline stabil dari ZIP terlampir. Acuan produk kembali ke sepuluh dokumen spesifikasi v1.1. Runtime aplikasi, script, test, dependency JavaScript, konfigurasi Tauri/CI dan aset berasal tepat dari source `a8f9e2ef1a1377282a0004dc6bebfb23bcdf8455`.

`main` dilanjutkan dari commit baseline tersebut, bukan dari versi API/planner. Head sebelum pemulihan `bcc3826923fcaf968ead4a17ebf370ee716a3097` dipertahankan di branch `archive/2026-10-17-before-original-baseline`. Update main memakai expected head agar perubahan orang lain tidak tertimpa. Arsip tidak digabung kembali ke main.

Dihapus dari jalur aktif: Flow WebView tertanam, Nexabot, frontend studio/planner lanjut dan API LLM generik yang ditambahkan setelah baseline. Tidak menghapus akun, token, profil browser, draf atau media di komputer pengguna. Tidak menjalankan installer pada mesin pengguna atau membuat migrasi downgrade.

## Identitas ZIP yang diverifikasi
| File | SHA-256 |
|---|---|
| aluraya-native-lock-and-executable.zip | acc002137c3726f42c68cb1b3e1aac3067f0767adb21c34510ffc430e74de44c |
| target/release/aluraya.exe | 21ccbfc8681ea5ba7b56752d651fc335350fb1894ebc5c8bb7caf594c525c8cf |
| target/release/bundle/nsis/Aluraya Studio_0.1.0_x64-setup.exe | 916b557df34fdd916d0f64a438ecd4719bca985baadc96aff839e36098d3e4ff |
| Cargo.lock | 79a86b155cd3c3f9acfbfabb1c116e77a0f99d01b1d87e7bb8aa624b33a63642 |
| Aluraya-Windows-Spec-v1.1(2).zip | 7d95e70b7f3e3f2fef7e073884b785ed6c9d3f3c5652a45a144cf223f2277ed5 |

ZIP executable 30.225.647 byte identik dengan digest GitHub artifact **11815215304** pada [run 38399230862](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38399230862), head **a8f9e2e**, dibuat 13 Oktober 2026. Installer 27.507.555 byte juga cocok dengan bukti packaging. ZIP berisi binary/Cargo.lock, tidak berisi source; source dipulihkan dari commit yang dibuktikan oleh identitas artifact, bukan dekompilasi atau dugaan versi.

Cargo.lock ZIP disalin persis ke `src-tauri/Cargo.lock`. Sepuluh dokumen ZIP disimpan byte-identik di `docs/spec-v1.1/`; dokumen root mengembalikan kebutuhan yang sama dengan status implementasi faktual. `BASELINE.json` menyimpan provenance dan hash dokumen. Binary besar tidak dimasukkan ke Git.

## Pemeriksaan pemulihan
- PASS hash ZIP utuh cocok dengan digest artifact GitHub, termasuk source commit dan ukuran.
- PASS source runtime/config/scripts/tests/public/package lock tidak berbeda dari a8f9e2e; hanya dokumentasi/manifest dan Cargo.lock dari artifact ditambahkan/disesuaikan.
- PASS 10 dokumen asli byte-identik dengan ZIP; Cargo.lock identik dengan file ZIP.
- PASS `npm ci`: 205 package dari lockfile baseline. Percobaan offline awal gagal karena cache tidak lengkap; instalasi normal berhasil, tidak mengubah lockfile.
- PASS `npm run check`: format, lint, 74 tes PASS + 1 DPAPI Windows SKIP (75 total, 13 file), typecheck, Vite dan sidecar build.
- PASS `git diff --check`.
- PASS historis CI baseline: 75 tes JavaScript Windows, 8 tes Rust, NSIS, runtime/IPC terpasang dan uninstall. [Laporan installer](WINDOWS-INSTALLER-REPORT.md).
- Native build ulang setelah pemulihan: belum dijalankan lokal (Linux). Workflow Windows berjalan pada push main; hasilnya tidak menggantikan identitas ZIP pengguna. Tidak mengklaim rebuild byte-identik dengan ZIP.
- NOT RUN GUI/laptop pengguna, upgrade/downgrade, login ChatGPT ulang, login/generasi Flow, media playback, RAM, billing nyata.

## Checkpoint yang berlaku
M-001 PARTIAL, TASK-004 BLOCKED. Thin slice ChatGPT pernah dibuktikan pengguna; Flow belum menghasilkan gambar/video otomatis ke canvas. Tidak ada izin pengeluaran dari pemulihan ini. M-002–M-006 menunggu gate integrasi. Pekerjaan selanjutnya hanya pembuktian jalur Flow yang didukung sesuai spek, bukan API alternatif, copy-paste manual atau ekspansi planner.
