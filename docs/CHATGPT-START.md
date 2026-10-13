# ChatGPT di Aluraya — TASK-003

Adapter sudah ditulis untuk jalur resmi proyek pribadi lokal. Login, entitlement akun, dan respons live belum dianggap lulus sebelum dicoba di Windows pengguna. Tidak diperlukan API key.

## Memulai

1. Tutup dev lama, tarik source terbaru, jalankan `npm.cmd ci`, lalu `npm.cmd run tauri dev`.
2. Buka tab **Copilot**, klik **Continue with ChatGPT**. Login di browser sistem dan izinkan penggunaan paket bila tersedia untuk akun/workspace Anda.
3. Kembali ke Aluraya. Identitas diverifikasi dan pilihan model diambil dari akun; tidak ada model buatan jika discovery gagal.
4. Buka **Manage usage**. Untuk hanya memakai langganan, nonaktifkan penggunaan kredit tambahan untuk Aluraya di pengaturan ChatGPT. Aluraya tidak mengubah pengaturan itu dan tidak dapat membuktikan nilainya melalui API ini. Centang konfirmasi setelah memeriksanya.
5. Pilih model dan kirim satu pesan singkat, misalnya `Jawab singkat dalam bahasa Indonesia: koneksi Aluraya berhasil.` Teks muncul bertahap; label **Selesai** hanya setelah event penyelesaian layanan.

Kirim screenshot status/hasil, bukan token atau URL callback login. CI dan fixture tidak membuktikan eligibility akun.

## Jika daftar model muncul tetapi pesan gagal

Buka **Rincian kegagalan** pada kotak error, lalu kirim screenshot yang memuat tahap, HTTP, kode, parameter dan Request ID. Rincian tidak memuat body layanan mentah atau kredensial. Jangan hapus akun atau mengulang login hanya karena error umum. Jangan mengirim berkali-kali sebelum penyebabnya diperiksa. Bila kotak lama belum menyediakan rincian, tutup aplikasi, pull source terbaru dan jalankan kembali; satu percobaan manual diperlukan untuk merekam error baru.

## Perilaku sesi

- Akun dapat ditambah dan dipilih; satu operasi aktif pada satu waktu. Pergantian akun mengosongkan percakapan aktif. Label nomor akun membedakan registrasi dengan email sama.
- Kredensial disimpan sebagai `accounts.dpapi` di direktori data lokal aplikasi, subfolder `chatgpt`. DPAPI mengikatnya ke pengguna Windows. Jangan pindahkan file ini ke repository, backup proyek, atau komputer lain.
- Windows PowerShell bawaan dipakai untuk panggilan DPAPI dan membuka browser melalui skrip tetap. Rahasia dikirim lewat stdin, bukan argumen command line. Kebijakan perangkat yang memblokir PowerShell akan menghasilkan error; aplikasi tidak mengubah kebijakan itu.
- Native host memegang file secara eksklusif untuk mencegah dua instance memperbarui token yang sama. Tutup jendela duplikat jika koneksi sedang dipakai. Jangan menghapus file akun untuk mengatasi lock.
- Token diperbarui mendekati kedaluwarsa; penggantian disimpan sebelum request selanjutnya. Keluar mencoba mencabut sesi, menghapus token lokal dan mempertahankan ID registrasi untuk login berikutnya. Jika pencabutan gagal, UI memberi tahu.
- Riwayat chat checkpoint ini hanya di memori. Batas sementara: pesan 4.000 karakter, jawaban 6.000 karakter dan konteks 24.000 karakter. Respons yang terputus/dibatalkan tidak dimasukkan ke konteks berikutnya. Mulai percakapan baru untuk mengosongkan konteks.
- Batas penggunaan menghentikan pesan baru; tidak ada retry otomatis, API key fallback atau pembelian kredit. Setelah meninjau pengaturan/menunggu ketersediaan, **Lihat / perbarui model** membuka kembali percobaan manual. Daftar model bukan jaminan sisa kuota.
- **Batalkan** menghentikan login/request sebisa mungkin; tidak menjamin penggunaan yang sudah diproses layanan dikembalikan. Pembaruan token yang sudah berjalan diselesaikan dahulu agar token pengganti tidak hilang.

Produksi Flow dan tool eksekusi belum tersedia. Copilot hanya menjawab teks; tidak menyimpan proyek atau menyetujui generasi.

## Sumber protokol

Diperiksa 12 Oktober 2026: [registrasi](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [sesi](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions), [model/inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [batas preview](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations), [error](https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery).
