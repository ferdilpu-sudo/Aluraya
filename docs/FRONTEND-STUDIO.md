# Frontend studio — draf lokal

**[Unduh installer frontend terbaru](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876/artifacts/11964370081)** — commit `d31890d`, [CI Windows PASS](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876). Login GitHub bila diperlukan, ekstrak ZIP, lalu jalankan `Aluraya Studio_0.1.0_x64-setup.exe`. Jika tautan langsung tidak mengunduh, buka halaman CI → Artifacts → `aluraya-native-lock-and-executable`.

Installer memuat editor draf frontend. API key tidak diperlukan untuk menulis naskah, mengelola aset lokal, dan menyusun storyboard. Sinkronisasi proyek/shot ke Nexabot menyusul.

Untuk pengembangan: `npm ci` lalu `npm run dev` untuk preview browser, atau `npm run tauri dev` di Windows.

1. Klik nama proyek → buat proyek atau buka draf yang sudah ada.
2. Naskah: tulis ide/cerita, pilih rasio, target durasi dan mode pengembangan.
3. Aset: tambah karakter/lokasi/properti, isi deskripsi, pilih JPG/PNG/WebP maksimal 4 MB. Ini referensi lokal, belum upload API.
4. Storyboard: tambah shot, isi aksi/kamera/dialog/SFX pada Detail, pilih referensi, tinjau rencana. Pindah ke Daftar shot untuk navigasi tanpa drag. Rapikan mengatur posisi grid. Urutan bisa diubah dari panel detail.
5. Klip & review: tinjau ringkasan rencana dan canvas hasil dari halaman riwayat Nexabot aktif. Media akun belum terikat proyek/shot. Backend akan disinkronkan berikutnya.
6. Cadangkan dari pemilih proyek atau layar review. JSON menyertakan draf/referensi lokal; tidak menyertakan key, sesi chat atau hasil provider. Impor JSON maksimal 50 MB membuat salinan proyek baru.

Tunggu **Draf tersimpan** sebelum menutup. Jika simpan gagal, UI menampilkan masalah dan tombol ulangi/cadangkan. IndexedDB milik browser/WebView lokal; menghapus data aplikasi/browser dapat menghapus draf. Preview browser dan aplikasi desktop tidak berbagi database. Penulisan proyek produksi ke SQLite dan ekspor klip belum termasuk tahap ini. Download JSON pada WebView Windows masih perlu pemeriksaan langsung.

Perubahan naskah/rasio/adaptasi membatalkan peninjauan shot. Edit aset membatalkan peninjauan shot yang merujuknya. Menggeser posisi tidak mengubah peninjauan. Status ditinjau tidak memberikan approval biaya atau jaminan kualitas hasil.

ChatGPT tetap memakai paket akun, tanpa fallback API berbayar. Konteks draf belum dikirim ke Copilot otomatis. Panel Nexabot lama tetap tersedia untuk permintaan terpisah yang memerlukan review biaya sendiri. Tidak memasukkan API key ke naskah/backup.
