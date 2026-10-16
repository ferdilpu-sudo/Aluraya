> ARSIP: integrasi ini dihapus pada ADR-016 (16 Oktober 2026). Bukan panduan runtime aktif; lihat [plan terbaru](../plan.md).

# Memulai Nexabot di Aluraya

[Unduh installer Nexabot](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876/artifacts/11964370081) — commit `d31890d`, [CI Windows PASS](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38717052876). Login GitHub bila diperlukan, ekstrak ZIP, jalankan `Aluraya Studio_0.1.0_x64-setup.exe`. Jika tautan langsung tidak mengunduh, buka halaman CI lalu pilih Artifacts → aluraya-native-lock-and-executable. Installer WebView2 lama tidak mendukung API key ini.

1. Tutup aplikasi lama, pasang installer terbaru, pilih **Koneksi & pengaturan** atau **Buka panel → Nexabot**. Editor draf tidak memerlukan key; langkah berikut hanya untuk form generasi terpisah.
2. Buat key di https://nexabot.id/api-keys, tempel ke input password di Aluraya lalu **Simpan key**. Jangan kirim key ke chat/repo.
3. Klik **Cek saldo**. Ini GET gratis menurut dokumentasi provider. Paket unlimited tidak berlaku untuk API.
4. Untuk uji pertama pilih **Gambar dari teks**, tulis prompt dan rasio. Klik **Periksa biaya**.
5. Tinjau input serta biaya aktual (dokumentasi0,15kredit/request), centang persetujuan, lalu **Generate** bila Anda menyetujuinya. Satu klik mengirim satu request.
6. Setelah selesai, hasil JPG tersimpan lokal dan muncul di canvas. Video dari teks memakai alur yang sama, sebagai request berbiaya terpisah.

Model/durasi dipilih provider. Upload referensi dan batch belum tersedia. Pengujian live pertama tetap perlu hasil dari pengguna; fixture CI bukan hasil AI nyata.

Key terenkripsi DPAPI CurrentUser; akun Windows yang sama dapat membacanya. Job/media disimpan di app-local `id.aluraya.studio/nexabot`. Tidak ada migrasi/hapus profil Flow lama. ChatGPT tetap memakai paket ChatGPT.

Saat aplikasi ditutup, job di Nexabot dapat terus berjalan. Buka kembali dan pilih **Lanjutkan pemantauan / unduhan**. Jeda hanya menghentikan pemantauan lokal, tidak membatalkan biaya/provider. Koneksi gagal saat submit → penerimaan belum pasti; jangan kirim ulang. Dokumentasi belum menyediakan pencarian job tanpaID, sehingga aplikasi menahan job baru dan memerlukan pemeriksaan riwayat/dukungan Nexabot. Catatan percobaan tetap tersimpan.

Unduhan gagal → lanjutkan jobID sama, tanpa generate baru. Redirect ke domain lain diblokir sampai kontrak domainnya terverifikasi. Laporkan pesan aman dan ID job, tanpa API key.
