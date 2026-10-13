# TASK-004 — profil Flow dan observasi awal

13 Oktober 2026. REQ-007/REQ-008/REQ-014; M-001 tetap in progress. ChatGPT thin slice live sudah PASS, Flow belum.

## Perubahan

- FlowSession terpisah dengan registry profil UUID app-local, Chrome/Edge persisten dan satu context aktif. Kegagalan baca registry tidak menimpa data lama.
- Bridge flow.action melalui host Tauri lokal, DTO ketat dua sisi, polling aktivitas. UI tidak memilih path/URL/executable atau memberi script ke browser.
- Pemeriksaan DOM read-only hanya pada Flow. Halaman login tidak dibaca. Kandidat label model/kredit dibatasi dan tidak dianggap harga/saldo/permission. generationReady dan costVerified dipaksa false; command submit tidak ada.
- Playwright Core 1.64.0 Apache-2.0 memakai browser yang sudah terpasang. Tidak ada download browser otomatis, stealth, pemindahan cookie atau endpoint Google privat. Runtime dinamis disertakan lengkap di sidecar resources; LICENSE/NOTICE dikumpulkan.
- Host memberi EOF saat keluar agar sidecar menutup context miliknya, menunggu maksimal dua detik lalu kill sidecar sebagai fallback. Tidak membunuh proses Chrome harian secara massal.

## Pemeriksaan

`npm run check`: PASS format/lint/typecheck/UI+sidecar build, 69 tes PASS; 1 tes DPAPI Windows dilewati di Linux. Bundle frontend 513 kB memunculkan warning ukuran; bukan benchmark RAM. Salinan playwright-core pada folder temporary terisolasi dapat require chromium.launchPersistentContext: PASS. Tes fixture tidak memanggil Flow/login/Generate.

CI Windows commit 2c4b5dc: FAIL pada tes penolakan field asing di action inspect Rust (run 38356305354). TypeScript checks dan prepare sidecar PASS; build release belum dijalankan karena tes native gagal. Percobaan pengguna membuktikan browser dapat dibuka, tetapi login ditolak; detail di bawah. DOM/account aktual, biaya, upload, submit, download otomatis, UI visual/keyboard lengkap dan cleanup browser saat crash: NOT RUN. Fixture bukan bukti Google menerima automation. Tidak ada pengeluaran atau generasi Flow dilakukan.

## Tindak lanjut

TASK-004 BLOCKED: hentikan percobaan login otomatis yang ditolak; pastikan jalur akses provider yang didukung sebelum pemeriksaan capability/biaya dan batch gambar. Tidak memperluas studio atau menyebut TASK-004 selesai sebelum hasil Flow otomatis masuk canvas.


## Bukti pengguna dan perbaikan — 13 Oktober 2026, 14:26 WIB

Screenshot pengguna menunjukkan Google “Couldn't sign you in” / “This browser or app may not be secure”, path Google Accounts `/v3/signin/rejected`, serta infobar Chrome `--no-sandbox`. SHA-256 gambar: `4beb5c6046febf80809c129d46c4a13efa4217f2095a225e621dc2db559f64f2`. Gambar dan URL query tidak disalin ke repository. Screenshot tidak memperlihatkan SHA build dan tidak membuktikan sandbox sebagai penyebab penolakan.

Patch TASK-004 / REQ-007/REQ-008/REQ-014:
- Aktifkan chromiumSandbox tanpa fallback melemahkan proteksi. Tes launch failure memastikan satu percobaan dan tidak ada argumen bypass.
- Klasifikasikan login_rejected dari origin/path; utamakan popup penolakan di atas tab Flow lama. Tidak membaca DOM login atau mengekspor query. UI menampilkan hambatan dan arahan berhenti.
- Perbaiki enum Rust action tanpa payload menjadi empty struct agar deny_unknown_fields diterapkan; validasi inspect/observe/close normal dan dengan field asing, serta snapshot login_rejected.

Pemeriksaan patch: npm run check — PASS format/lint/typecheck/build, 71 tes PASS + 1 tes DPAPI Windows skipped di Linux. Warning bundle 513.68 kB tetap ada; bukan hasil benchmark. Native Windows patch — menunggu CI. Login setelah patch, peringatan sandbox hilang pada Windows, dan penerimaan Google — NOT RUN. Fixture tidak membuktikan login berhasil. M-001 tetap belum lulus; aturan berhenti AGENTS.md berlaku pada modul Flow.
