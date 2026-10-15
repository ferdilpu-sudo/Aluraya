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
