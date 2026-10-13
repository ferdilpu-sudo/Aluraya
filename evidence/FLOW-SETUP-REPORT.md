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

Tes Rust untuk kontrak Flow ditambahkan, tetapi native build/test patch ini menunggu CI Windows. Windows launch/login, DOM/account aktual, biaya, upload, submit, download otomatis, UI visual/keyboard lengkap dan cleanup browser saat crash: NOT RUN. Fixture bukan bukti Google menerima automation. Tidak ada pengeluaran atau generasi Flow dilakukan.

## Tindak lanjut

Ikuti docs/FLOW-START.md: satu profil, login pengguna, buka proyek, periksa label dan tampilkan pengaturan model/biaya. Hasilnya menentukan observer yang dapat diverifikasi dan batch gambar konkret berikutnya. Tidak memperluas studio atau menyebut TASK-004 selesai sebelum hasil Flow otomatis masuk canvas.
