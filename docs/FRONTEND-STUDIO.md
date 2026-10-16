# Studio — canvas produksi terpadu

Acuan aktif ADR-016 (16 Oktober 2026). Canvas utama menampung naskah/aset di atas, storyboard di tengah, slot hasil di bawah. Copilot berada di kanan. Nexabot sudah dihapus; Flow tidak diaktifkan kembali.

1. Buka/buat proyek melalui nama proyek di header. Draf lama tetap bisa dibuka.
2. Klik Naskah atau kartu cerita untuk menyunting ide, rasio, target durasi dan adaptasi dalam Detail.
3. Klik Aset untuk menambah karakter/lokasi/prop serta JPG/PNG/WebP lokal. Referensi tampil pada canvas yang sama.
4. Copilot API mendukung Chat Completions teks melalui backend Windows. Tombol penerapan usulan masih nonaktif sampai proposal terstruktur tersambung. Shot manual tersedia untuk menyunting draf; pilih kartu shot untuk aksi/dialog/SFX/kamera/referensi.
5. Navigasi Storyboard/Hasil memusatkan canvas. Cari shot, pan/zoom, minimap, pilih banyak node dan Rapikan tersedia. Slot hasil belum berisi media produksi.
6. Buka Koneksi API untuk profil LLM/gambar/video, edit JSON lanjutan dan routing. Ikuti [API-PROVIDERS](API-PROVIDERS.md). Menyimpan config tidak mengirim request atau menguji API.
7. Cadangkan draf melalui dialog proyek. JSON draf bukan ekspor klip; config provider diimpor/diekspor terpisah, tanpa key.

ChatGPT akun tersedia sebagai opsi terpisah dalam Copilot; tidak menjadi fallback biaya. Konteks draf belum otomatis dikirim. Review rencana berbeda dari approval produksi. Penyimpanan draf lokal tidak bergantung pada API. Status simpan/error/offline tetap ditampilkan.

Build terbaru: lihat [Actions](https://github.com/ferdilpu-sudo/Aluraya/actions) untuk workflow commit reset provider; unduh artifact `aluraya-native-lock-and-executable` hanya setelah run berhasil. Installer lama d31890d masih memuat Nexabot dan bukan versi perubahan ini. Hasil pengujian terbaru dicatat pada [laporan reset](../evidence/PROVIDER-RESET-REPORT.md). GUI Windows dan provider live belum diverifikasi pada checkpoint ini.

Panduan request teks, key dan tarif: [API-LLM-START](API-LLM-START.md). Respons Copilot tidak otomatis mengubah draf.
