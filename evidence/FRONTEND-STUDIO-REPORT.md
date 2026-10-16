# Frontend studio — laporan implementasi

Tanggal: 15 Oktober 2026. Otorisasi: pengguna meminta frontend diselesaikan dahulu, sinkronisasi backend/API key berikutnya. Tidak ada key baru atau generasi berbayar dijalankan.

## Perubahan
- Shell empat tahap, pemilih proyek, panel yang dapat ditutup, status simpan/offline dan layout responsif.
- Editor naskah, format/target dan mode adaptasi; draf IndexedDB dengan versi dan penulisan berurutan.
- Aset karakter/lokasi/properti, gambar lokal tervalidasi tipe/ukuran/decode, filter dan referensi shot.
- Canvas pan/zoom, minimap, kartu editable, layout tersimpan, pencarian, rapikan, alternatif daftar, urutan/duplikat/hapus shot.
- Peninjauan rencana, invalidasi setelah perubahan, import-copy dan ekspor JSON tanpa rahasia.
- Canvas media Nexabot pada layar review; riwayat akun belum diklaim milik proyek. Single video playback, tanpa autoplay. Panel provider/cost approval tidak diubah.

## Bukti
- PASS `npm run check`: format, lint, 14 file tes, 83 tes PASS dan 2 Windows-only SKIP, TypeScript, build UI dan sidecar.
- PASS `git diff --check`.
- Enam tes baru memeriksa round-trip layout, invalidasi review, penghapusan referensi terarah, penolakan schema/URL remote/extra fields, impor salinan dan blocker rencana kosong.
- NOT RUN uji interaksi/visual browser: binary browser lokal tidak tersedia; download runtime browser gagal; browser cloud juga timeout. Tidak ada screenshot yang diklaim sebagai bukti.
- NOT RUN UI Windows/DPI, import/decode gambar secara interaktif, download JSON di WebView, durabilitas IDB setelah force-kill, banyak jendela bersamaan, RAM/performa target.
- NOT RUN live Nexabot, key/saldo/generasi, pengaitan proyek/shot dengan job, compiler AI dan ekspor klip native.

## Batas
Draf frontend adalah lapisan sementara yang eksplisit (ADR-015), bukan M-002 native/SQLite selesai. Backup JSON maksimal 50 MB saat impor; penyimpanan lokal mengikuti kuota WebView. Hasil provider tidak disalin ke backup. Integrasi backend berikutnya harus migrasi data secara aman, memetakan project/shot/version ke job, serta tetap membekukan input/biaya sebelum submit. Tidak ada klaim semua AC produk telah lulus.

Referensi engineering: https://reactflow.dev/api-reference/react-flow (node changes, drag stop, fit view).

## Verifikasi installer — 16 Oktober 2026

Run [38717052876](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876) pada commit `d31890d1af3b54f718df377dabc804de8dbe65d4` SUCCESS. Job `116362205758`: 85 tes JavaScript PASS, 12 tes Rust PASS, build NSIS PASS dan delapan pemeriksaan install/runtime/uninstall PASS. Report asli dari log CI disimpan di [FRONTEND-INSTALLER.json](FRONTEND-INSTALLER.json).

[Installer frontend](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876/artifacts/11964370081), artifact `11964370081`, `aluraya-native-lock-and-executable`, belum expired saat diperiksa. Installer `Aluraya Studio_0.1.0_x64-setup.exe`: 25.720.736 byte; SHA256 `337dc2fe1808b15fea82fe8f4066cc870717e2e790af0ad501fab9b2e48fc1ce`. Artifact laporan: `11963202861`.

Ini bukti packaging/runtime, bukan bukti interaksi GUI. Batas NOT RUN di atas tetap berlaku. Tidak mengulang tes rutin atau melakukan panggilan generasi provider.
