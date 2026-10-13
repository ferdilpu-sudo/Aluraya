# Flow di Aluraya — koneksi awal TASK-004

ChatGPT sudah menjawab di aplikasi. Tahap berikut ini membuka profil Flow khusus dan membaca label yang terlihat; upload, Generate dan impor otomatis belum aktif.

1. Tutup Aluraya/dev lama. Jalankan `git pull --ff-only origin main`, `npm.cmd ci`, lalu `npm.cmd run tauri dev`.
2. Buka tab **Flow**. Pilih **Google Chrome** atau **Microsoft Edge** yang sudah terpasang, lalu **Tambah profil Flow**.
3. Klik **Buka** pada profil. Login Google sendiri di jendela yang muncul dan buka proyek Flow. Browser memakai profil khusus Aluraya; login browser harian tidak disalin.
4. Kembali ke Aluraya dan klik **Periksa halaman Flow**. Catat jenis halaman dan apakah kolom input terlihat.
5. Di Flow, buka menu akun untuk menampilkan saldo. Klik **Periksa halaman Flow** lagi. Bila perlu, buka pengaturan prompt untuk model dan biaya, lalu periksa lagi. Aluraya tidak mengklik menu provider atau mengirim prompt pada fase ini.
6. Kirim screenshot panel Flow Aluraya dan pengaturan model/biaya di Flow. Hindari menampilkan email atau informasi akun lain. Jangan sertakan cookie, profil browser atau URL login.

Jika label tidak terbaca, itu belum berarti saldo nol atau model tidak tersedia. Label adalah kandidat teks, bukan observasi saldo/biaya yang terverifikasi. Belum ada persetujuan generasi atau izin pembelian kredit pada langkah ini.

Jika Google menolak login browser otomatis, berhenti pada layar itu dan kirim pesannya. Jangan menyalin cookie atau memakai profil default untuk melewati penolakan. Jika browser gagal terbuka, pastikan browser pilihan terpasang dan tutup jendela Flow Aluraya lama. **Tutup browser Flow** menutup hanya context milik aplikasi; sesi profil tetap disimpan untuk dipakai lagi.

Profil disimpan di folder data lokal aplikasi, `flow/<UUID>`, dengan registry metadata `profiles.json`. Profil berisi sesi sensitif; jangan commit, bagikan atau ikutkan dalam ekspor proyek. Banyak profil dapat disimpan, hanya satu dibuka oleh aplikasi pada satu waktu. Menambah profil tidak mengaktifkan generasi.
