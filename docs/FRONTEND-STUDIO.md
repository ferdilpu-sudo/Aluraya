# Frontend studio — draf lokal

Jalankan source terbaru melalui `npm ci` lalu `npm run dev` untuk preview browser, atau `npm run tauri dev` di Windows. Installer 57685d5 sebelumnya belum memuat frontend ini.

1. Klik nama proyek → buat proyek atau buka draf yang sudah ada.
2. Naskah: tulis ide/cerita, pilih rasio, target durasi dan mode pengembangan.
3. Aset: tambah karakter/lokasi/properti, isi deskripsi, pilih JPG/PNG/WebP maksimal 4 MB. Ini referensi lokal, belum upload API.
4. Storyboard: tambah shot, isi aksi/kamera/dialog/SFX pada Detail, pilih referensi, tinjau rencana. Pindah ke Daftar shot untuk navigasi tanpa drag. Rapikan mengatur posisi grid. Urutan bisa diubah dari panel detail.
5. Klip & review: tinjau ringkasan rencana dan canvas hasil dari halaman riwayat Nexabot aktif. Media akun belum terikat proyek/shot. Backend akan disinkronkan berikutnya.
6. Cadangkan dari pemilih proyek atau layar review. JSON menyertakan draf/referensi lokal; tidak menyertakan key, sesi chat atau hasil provider. Impor JSON maksimal 50 MB membuat salinan proyek baru.

Tunggu **Draf tersimpan** sebelum menutup. Jika simpan gagal, UI menampilkan masalah dan tombol ulangi/cadangkan. IndexedDB milik browser/WebView lokal; menghapus data aplikasi/browser dapat menghapus draf. Preview browser dan aplikasi desktop tidak berbagi database. Penulisan proyek produksi ke SQLite dan ekspor klip belum termasuk tahap ini. Download JSON pada WebView Windows masih perlu pemeriksaan langsung.

Perubahan naskah/rasio/adaptasi membatalkan peninjauan shot. Edit aset membatalkan peninjauan shot yang merujuknya. Menggeser posisi tidak mengubah peninjauan. Status ditinjau tidak memberikan approval biaya atau jaminan kualitas hasil.

ChatGPT tetap memakai paket akun, tanpa fallback API berbayar. Konteks draf belum dikirim ke Copilot otomatis. Panel Nexabot lama tetap tersedia untuk permintaan terpisah yang memerlukan review biaya sendiri. Tidak memasukkan API key ke naskah/backup.
