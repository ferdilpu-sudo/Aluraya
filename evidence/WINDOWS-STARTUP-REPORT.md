# TASK-002 — startup Windows dan watcher

Tanggal: 12 Oktober 2026. REQ terkait: fondasi runtime Windows untuk REQ-002, REQ-007 dan REQ-014; integrasi provider belum lulus.

## Bukti pengguna

Log lanjutan setelah perbaikan lisensi menyatakan `Windows sidecar prepared with Node runtime and license.`, build debug selesai dalam 7m 55s, lalu `target\debug\aluraya.exe` dijalankan. Screenshot memperlihatkan jendela Aluraya Studio dengan canvas dan panel copilot. **PASS** untuk persiapan runtime, kompilasi debug dan pembukaan UI; ini bukan bukti installer, IPC atau login provider.

Log juga mencatat EBUSY saat Vite memantau DLL, EXE dan PDB di `src-tauri/target`. `vite.config.ts` sekarang mengecualikan seluruh `src-tauri`; Tauri tetap menangani watch Rust. Pola ini mengikuti [panduan Vite resmi Tauri](https://v2.tauri.app/start/frontend/vite/).

## Bukti CI dan perbaikan

[Run 38192824509](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38192824509), commit `6d9caf918fd7c91811f09f81553f075a0fa6e5dd`: **FAIL** di format check, 34 file diperingatkan Prettier pada checkout Windows. Native checks belum dijalankan. Source LF lolos pemeriksaan lokal; checkout Windows memakai konversi akhir baris. `.gitattributes` menetapkan LF untuk file teks dan binary untuk PNG/ICO.

## Verifikasi perubahan

- **PASS**: `npm run check` pada Node v24.19.0/Linux: format, lint, 20 tes, typecheck, build UI/sidecar.
- **PASS**: inspeksi `createServer().watcher.getWatched()` Vite aktif menyertakan direktori frontend `src` dan mengecualikan seluruh `src-tauri`. Probe awal timeout karena menunggu event ready setelah inisialisasi; probe ulang membaca daftar watch aktif.
- **NOT RUN**: konfirmasi EBUSY hilang pada Windows setelah perubahan, round-trip UI–Rust–Node, release/installer dan live ChatGPT/Flow.

Langkah pengguna: pull, hentikan dev lama, jalankan ulang, lalu tab Koneksi → Periksa sekarang. Host dan sidecar seharusnya Terhubung; provider tetap Belum siap sampai adapter diimplementasikan.
