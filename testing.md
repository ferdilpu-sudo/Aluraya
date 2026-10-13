# Rencana verifikasi — Aluraya

Pembaruan 13 Oktober 2026: TEST-002 thin slice chat live PASS berdasarkan screenshot pengguna; quota pause/no fallback PASS dengan fixture. Tes penerimaan lainnya belum lulus. Catatan 12 Oktober di bawah adalah checkpoint historis, bukan status terbaru.

## Strategi
Unit untuk approval/scheduler/dependency; integrasi untuk transaksi, restart dan media; contract test untuk schema lintas Rust/TS dan respons provider; UI smoke untuk canvas. Live Flow hanya sesudah pengguna menyetujui model/biaya batch. Jangan memakai akun/kredit nyata di CI.

## Matriks lingkungan
- Utama: laptop pengguna, Windows 11 Enterprise LTSC 24H2 x64, RAM 8 GB, i7-1165G7.
- UI: DPI 100/150%, keyboard dan resize; WebView2 versi aktual dicatat.
- Provider: akun dengan saldo cukup, habis, stale/unknown, sesi expired, model tidak didukung, shared pool menggunakan fixture dahulu.
- Fault: koneksi putus sebelum/sesudah submit, browser crash, sidecar crash, aplikasi restart, disk penuh, URL download kedaluwarsa.

## Traceability
| Test | Requirement | Acceptance | Level | Langkah dan hasil yang diharapkan | Status |
|---|---|---|---|---|---|
| TEST-001 | REQ-001 | AC-001 | integration | Ide dan naskah Fountain/teks dapat menjadi proyek; sumber asli tetap tersimpan. Mode adaptasi harus dipilih sebelum memendekkan atau menambah cerita. | NOT RUN |
| TEST-002 | REQ-002 | AC-002 | integration | Login resmi dengan izin penggunaan paket berhasil dan respons tampil dalam aplikasi. Saat kuota habis pekerjaan berhenti; tidak ada fallback berbayar atau pembelian otomatis. | PASS thin slice live + quota fixture; lihat bukti |
| TEST-003 | REQ-003 | AC-003 | UI | Pengguna dapat pan/zoom, pilih banyak node, kelompokkan, atur otomatis, dan membuka detail. Posisi serta hubungan pulih setelah restart. | NOT RUN |
| TEST-004 | REQ-004 | AC-004 | integration | Gambar unggahan atau hasil Flow dapat dipilih sebagai versi referensi karakter/lokasi/prop. Impor tidak mengubah berkas sumber pengguna. | NOT RUN |
| TEST-005 | REQ-005 | AC-005 | contract | Naskah menghasilkan daftar adegan/shot dengan dialog, SFX, kamera, durasi estimasi, referensi dan kontinuitas. Kekurangan sumber ditandai; tidak diklaim sebagai naskah lengkap. | NOT RUN |
| TEST-006 | REQ-006 | AC-006 | unit | Naskah, aset, storyboard, serta batch generasi memiliki persetujuan tersendiri. Submit ditolak jika persetujuan tidak cocok dengan versi input/model/biaya. | NOT RUN |
| TEST-007 | REQ-007 | AC-007 | E2E | Dari batch disetujui, aplikasi mengunggah referensi, mengirim, memantau, mengambil media dan menampilkan preview tanpa pengguna menyalin prompt atau mengunduh hasil di browser. | NOT RUN |
| TEST-008 | REQ-008 | AC-008 | unit | Tidak ada batas jumlah akun buatan produk. Akun aktif dengan saldo cukup dan kemampuan sesuai dipilih bergiliran; kredensial/profil tidak tercampur. | NOT RUN |
| TEST-009 | REQ-009 | AC-009 | manual | Setiap klip memiliki prompt dialog verbatim dan SFX, tanpa permintaan musik/subtitle. Hasil dapat diputar dan dinilai manusia; ketidaksesuaian bisa direvisi per shot. | NOT RUN |
| TEST-010 | REQ-010 | AC-010 | integration | Restart saat submit ambigu menghasilkan rekonsiliasi, bukan submit ulang otomatis. Selesainya media di provider tidak diklaim siap sebelum impor lokal berhasil. | NOT RUN |
| TEST-011 | REQ-011 | AC-011 | unit | Perubahan aset menandai hanya turunannya yang relevan sebagai usang; tidak menghapus hasil lama. Shot dependent menunggu last frame dari versi hasil yang diterima. | NOT RUN |
| TEST-012 | REQ-012 | AC-012 | unit | 9:16 atau 16:9 dipilih per proyek; target durasi dan jumlah durasi shot ditampilkan terpisah. Model yang tidak mendukung konfigurasi diblokir sebelum submit. | NOT RUN |
| TEST-013 | REQ-013 | AC-013 | integration | Klip terpilih dan metadata prompt/shot dapat diekspor dalam urutan scene-shot; nama tidak bertabrakan dan berkas asli tidak tertimpa diam-diam. | NOT RUN |
| TEST-014 | REQ-014 | AC-014 | performance | Default satu job dan satu profil Flow aktif; banyak akun tersimpan tidak membuka banyak browser. Video hanya dimuat saat diperlukan; aplikasi tetap menerima pause saat job berlangsung. | NOT RUN |
| TEST-015 | REQ-015 | AC-015 | integration | Proyek dapat dibuka offline untuk edit/preview lokal. Backup dapat dipulihkan tanpa token/profil login. Migrasi gagal tidak merusak database yang masih valid. | NOT RUN |

## Skenario risiko konkret
- TEST-006: approve revision 2, edit prompt jadi revision 3, enqueue dengan approval lama -> APPROVAL_STALE, tidak ada submit provider. Copilot mengirim approved=true tidak melewati gate.
- TEST-008: A saldo 0, B saldo cukup tetapi tidak punya model, C layak -> pilih C. Sesi A/C terisolasi. Dua akun shared pool tidak boleh mereservasi saldo yang sama dua kali. 100 akun sintetis tersimpan hanya membuka satu profil.
- TEST-010: provider menerima submit lalu koneksi terputus sebelum ack. Restart -> uncertain; reconcile hasil lama, jumlah submit tetap satu. Jika tidak bisa membuktikan cocok, tetap pause. Download gagal -> ulang download, bukan submit.
- TEST-011: asset master berubah setelah shot accepted -> hasil lama masih ada, descendants stale; shot independen tetap siap. Cycle dependency ditolak.
- TEST-007: satu gambar dan satu video nyata hasil Flow tampil otomatis di node yang benar setelah app restart. Login boleh manual; prompt/upload/poll/download tidak manual. Catat bukti tanpa token atau screenshot akun sensitif.
- TEST-009: dengarkan klip aktual; nilai speaker, ketepatan dialog, SFX, tidak ada musik/subtitle yang tidak diminta. Kegagalan kualitas adalah review/retry, bukan klaim generator selalu memenuhi prompt.
- TEST-014: 200 node/300 edge thumbnail, satu video player dan satu Flow job. Catat baseline OS, peak seluruh process tree, memori tersedia, p95 interaksi, crash/page pressure; jangan mengarang angka RAM target. Jika target 200 ms tak tercapai, profile dan perbaiki, lalu laporkan.

## Tool dan gate
Rekomendasi: Vitest untuk TS domain/contracts, cargo test untuk Rust, UI runner yang kompatibel dengan Tauri/WebView2 dipilih di M-001. Playwright untuk adapter/browser fixture tidak otomatis membuktikan driver Tauri E2E.
Perintah lint/typecheck/test/build di README adalah rencana sampai scaffolding. CI menjalankan domain/contract/DB fixture + build; live provider tidak masuk default CI. Gate Windows nyata wajib untuk installer, OAuth, browser dan media playback.

## Pelaporan dan penerimaan
Setiap bukti mencatat tanggal, commit, lingkungan, command, PASS/FAIL/NOT RUN, expected/observed, dan risiko tersisa. M-001 gagal jika satu pun integrasi inti tidak bisa dibuktikan. MVP diterima setelah semua AC terpenuhi; jangan memperpanjang pengujian berulang tanpa bug/risiko baru. Jika akses provider terblokir, dokumentasikan blocker dan berhenti pada modul terkait.

## TEST-016 — REQ-016 / AC-016 (NOT RUN)
Contract/unit/UI: compile empat jenis prompt dari fixture struktur. Semua reference label cocok dengan urutan upload dan hash file. Ubah urutan model card; compiler memperbarui mapping tanpa menukar identitas. Reference count melebihi capability -> blocker, tidak membuang referensi.
Fixture positif: nine-panel 1..9 berurutan, beat menutup durasi, sceneCast tiga tokoh dengan close-up satu visible character, board plan-only, dialog Indonesia, no music. Fixture negatif: panel hilang/duplikat, timeline gap/overlap, reference unresolved, board masuk start-frame slot, kamera locked-off+handheld pada beat sama, klaim observed frame tanpa file actual. Lint harus memblokir konflik pasti.
Fixture warning: speech budget sempit; high dynamic range dengan no HDR look; style field ambiguous. Warning memiliki alasan dan dapat ditinjau, bukan silent rewrite. Ubah prompt manual sesudah approve -> APPROVAL_STALE dan needs_validation. E2E inspeksi klip memastikan frame pembuka tidak berupa grid; kegagalan hasil masuk review, bukan hanya lolos lint.


## Bukti fondasi TASK-002 — 12 Oktober 2026

`npm run check` menjalankan format, lint, 14 tes Vitest, typecheck dan build frontend/sidecar. Laporan aktual ada di [evidence/M001-REPORT.md](./evidence/M001-REPORT.md), log terakhir di [evidence/check.log](./evidence/check.log).

- `tests/protocol.test.ts`: framing terbatas, UTF-8 terfragmentasi/rusak, frame terpotong/besar, command generasi/approval/shell ditolak, payload asing ditolak, status provider tidak dipalsukan.
- `tests/sidecar-process.test.ts`: executable Node nyata menjalankan bundle, dua request berkorelasi, EOF menutup proses, input invalid tidak bocor ke output.
- `tests/browser-boundary.test.ts`: preview browser tidak mengaku sebagai host/provider terhubung.
- `src-tauri/tests/frame_reader.rs`: tes Rust disediakan; **NOT RUN** karena Rust tidak tersedia di lingkungan Linux ini.
- UI browser smoke **NOT RUN**: Chromium tidak terpasang dan unduhan yang dicoba tidak menghasilkan arsip valid. Tidak ada klaim visual QA, keyboard QA penuh, atau screenshot terverifikasi.
- Native build, IPC Rust–Node, packaging, Windows WebView2, OAuth, Flow, proses restart dan performa: **NOT RUN**. Tes Node–Node tidak menggantikan kontrak lintas Rust–TypeScript.

Workflow `.github/workflows/windows.yml` disediakan tetapi belum dikirim/dijalankan di GitHub. CI tidak memakai akun atau kredit provider.


### Regresi lisensi startup Windows

`tests/node-license.test.mjs` memverifikasi enam kasus resolver lisensi. `npm run check` mencakupnya bersama 14 tes sebelumnya (total 20). Fetch fixture tidak dianggap live Windows test. Pemeriksaan terpisah mengambil LICENSE resmi Node v24.19.0 dari tag upstream; startup Windows masih NOT RUN setelah perbaikan.

### Pembaruan startup dan watcher Windows — 12 Oktober 2026

Status berikut menggantikan NOT RUN startup pada checkpoint sebelumnya: build debug dan pembukaan jendela Windows **PASS berdasarkan log/screenshot pengguna**. IPC Rust–Node belum dibuktikan oleh screenshot. `npm run check` **PASS** (20 tes) setelah perubahan watcher; inspeksi watcher Vite aktif di Linux **PASS** untuk frontend terpantau dan `src-tauri` diabaikan. Probe pertama menunggu event `ready` yang sudah lewat dan timeout; probe diperbaiki untuk membaca daftar watch aktif. Konfirmasi EBUSY hilang di Windows **NOT RUN**.

CI Windows pada commit `6d9caf9` **FAIL** di Prettier (34 file); native gate terlewati. Checkout CRLF tidak cocok dengan format LF source. `.gitattributes` kini menetapkan LF untuk teks dan menjaga PNG/ICO sebagai binary. Lihat [laporan startup](./evidence/WINDOWS-STARTUP-REPORT.md); CI baru harus diperiksa terpisah dari hasil lokal.

### TASK-003 — ChatGPT adapter

Tes tambahan memeriksa OAuth callback/PKCE, JWT, scope gate, model, request Responses, refresh, quota/cancel dan SSE parsial. Tes DPAPI Windows dijalankan hanya pada Windows. Tes Rust chat_contracts menolak field privileged dan kebocoran token dalam DTO. Snapshot Windows pengguna 18:26:55 mengonfirmasi round-trip fondasi dan CI b3ae671 sudah PASS; tidak menggantikan live OAuth yang masih NOT RUN. Lihat [laporan adapter](./evidence/CHATGPT-ADAPTER-REPORT.md).

### TASK-003 — bukti live 13 Oktober 2026

Screenshot pengguna 09:18 memperlihatkan GPT-6.1-Sol menjawab `tes` dengan label Selesai. Login/izin, discovery dan respons dalam aplikasi PASS pada thin slice; kuota/pause/no fallback diverifikasi fixture, bukan sengaja menghabiskan kuota akun. Tidak meminta pengulangan tes yang sama. Logout/restart/multiakun live dan kontrol billing aktual tidak terverifikasi oleh gambar. Detail dan keterbatasan ada pada [laporan adapter](./evidence/CHATGPT-ADAPTER-REPORT.md).


### TASK-004 — setup Flow

`flow-session` memeriksa single browser, busy lock, banyak profil/pagination, failure registry tanpa overwrite, error redaction, shutdown saat launch pending dan penolakan command submit/path/URL. `flow-observation` memeriksa origin spoofing dan ekstraksi label terbatas tanpa price/credit authority. `flow_contracts` Rust menolak input/path/privilege asing dan generationReady=true. Lokal: npm run check PASS 69 tes + 1 Windows-only skipped. Pemanggilan playwright-core dari salinan runtime terisolasi PASS. Login/capability/biaya/submit/unduh Flow tetap NOT RUN; ini bukan TEST-007 PASS.
