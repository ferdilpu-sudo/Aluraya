# M-001 — laporan checkpoint source 0.1.0

> Pembaruan 13 Oktober 2026: laporan fondasi di bawah merupakan riwayat. ChatGPT thin slice live kini PASS berdasarkan screenshot pengguna 09:18 (jawaban GPT-6.1-Sol, status Selesai); lihat [laporan adapter](./CHATGPT-ADAPTER-REPORT.md). Flow, installer dan gate M-001 lainnya tetap belum lulus.


Tanggal: 12 Oktober 2026. Lingkungan: Linux x64, Node 24.19.0, npm 11.9.0. Tidak ada repository remote/commit; identitas paket dicatat oleh SHA-256 pada manifest source. **Status milestone: IN PROGRESS, exit gate BLOCKED.**

## Perubahan

- TASK-002: scaffold Tauri 2, React, TypeScript strict dan React Flow; satu kartu hasil kosong, panel copilot nonaktif, panel diagnostik dengan loading/error/empty states.
- Host native mempunyai satu command read-only melalui capability window lokal; sidecar Node persistent menggunakan stdio. Tidak ada shell arbitrer atau akses provider dari UI.
- Validasi DTO, ukuran frame, UTF-8, command allowlist, korelasi request, timeout delapan detik dan cleanup proses. Status provider tidak mengikuti PASS runtime secara otomatis.
- Script build, runtime bundling Windows dengan hash/lisensi, doctor, peluncuran PowerShell dan sampel process-tree memory. Ikon aplikasi dibuat dari SVG lokal.
- Plan, schema, arsitektur dan keputusan diperbarui. Panduan Windows menjelaskan source ini belum menjadi aplikasi produksi.

Terkait: TASK-001/002/006/007, fondasi REQ-002/007/014. **Belum memenuhi AC-002/007/014.** Tidak ada database/proyek persisten, OAuth, Flow adapter, capability/credit observer, approval batch, media import, recovery submit atau scheduler yang sudah diimplementasikan.

## Verifikasi aktual

| Pemeriksaan | Status | Bukti |
|---|---|---|
| Format source | PASS | npm run format:check; check.log |
| Lint | PASS | npm run lint; check.log |
| TypeScript strict | PASS | npm run typecheck melalui build; check.log |
| Unit/proses sidecar | PASS, 14 tes | npm run test; 3 file tes; check.log |
| Build UI dan bundle sidecar | PASS | npm run build; check.log |
| Tauri config structure | PASS | Validasi config.schema.json dari CLI dengan Ajv; format numerik custom tidak dievaluasi |
| Runtime JS license inventory | PASS | npm run notices; public/THIRD-PARTY-NOTICES.txt |
| Doctor | BLOCKED, expected | doctor.json: Linux, cargo/rustc tidak tersedia |
| Browser smoke/visual inspection | NOT RUN | Playwright terpasang tetapi binary Chromium tidak ada; unduhan gagal: arsip tidak valid |
| Rust tests / Rust–Node contract / native build | NOT RUN | Rust toolchain/Windows tidak tersedia |
| Installer / Windows startup / WebView2 | NOT RUN | Perlu laptop Windows pengguna atau CI Windows |
| ChatGPT login / permission / models / streaming | NOT IMPLEMENTED, NOT RUN | Adapter belum dibuat; akun pengguna belum dihubungkan |
| Flow gambar/video → canvas | NOT IMPLEMENTED, NOT RUN | Adapter/profil, observasi biaya dan persetujuan batch belum tersedia |
| Live submit recovery / RAM / p95 | NOT RUN | Transport test bukan pembuktian recovery produksi/performa |

Rincian tes: UTF-8 split, beberapa frame, frame terlalu besar, EOF terpotong, UTF-8 invalid; respons kesehatan jujur; tiga command terlarang; payload approval palsu; versi/ID invalid; dua uji child process; browser tidak mengaku desktop. Tidak ada network call atau pengeluaran provider pada tes.

## Batas hasil

1. `npm run build` bukan build executable Windows. Belum ada installer yang diserahkan.
2. Canvas placeholder bukan media Flow. Panel chat belum dapat menerima respons.
3. `Cargo.lock`, verifikasi versi/lisensi Rust dan verifikasi packaging wajib diselesaikan pada build native pertama. Tidak ada klaim seluruh dependensi native terkunci.
4. GitHub workflow disediakan sebagai source; belum dijalankan atau dipublikasikan. Tidak ada remote repository yang diubah.
5. Tidak ada QA tampilan atau aksesibilitas Windows yang diklaim. UI build/typecheck tidak membuktikan kualitas visual.

## Langkah berikutnya

Jalankan `npm.cmd ci` lalu `npm.cmd run tauri dev` pada Windows sesuai [panduan](../docs/WINDOWS-START.md). Klik **Periksa sekarang** dan buktikan host/sidecar terhubung. Lanjutkan implementasi TASK-003 OAuth resmi dengan kredensial terlindungi OS, lalu adapter Flow pada profil khusus. Provider integration tetap pekerjaan lanjutan, bukan sekadar menekan tombol login yang sudah ada.

AGENTS.md/plan.md menahan ekspansi studio sampai M-001 terbukti. Pekerjaan source ini tidak memberi persetujuan untuk menghabiskan kredit; batch aktual harus memperlihatkan model, referensi, biaya dan batas percobaan sebelum disetujui.
