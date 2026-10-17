# Usulan aset dan shot ke canvas

PLAN-001 partial, 16 Oktober 2026. Alur ini kembali ke studio awal: naskah/ide → usulan Copilot → review → draf pada canvas yang sama. Nexabot dihapus dan Flow tidak digunakan. Provider/model Chat Completions dapat Anda atur; executor protokol lain dan produksi gambar/video masih menyusul.

## Penggunaan
1. Tulis ide atau naskah pada proyek. Pilih preserve untuk menjaga dialog verbatim, adapt/expand untuk usulan perubahan.
2. Atur [Copilot API](API-LLM-START.md): koneksi, model dan key pada aplikasi Windows. Menyimpan key tidak mengirim request.
3. Di **Usulan untuk canvas**, tentukan **Ide / premis**, **Cuplikan naskah**, atau **Naskah lengkap**. Pilih teks yang berasal dari naskah proyek. **Muat naskah saat ini** mengambil teks terbaru; sumber tidak berubah otomatis ketika Anda menyunting naskah.
4. Klik **Siapkan usulan aset & shot**. Periksa pesan yang terbentuk: sumber, pengaturan proyek, deskripsi aset dan judul shot ikut dikirim. Gambar tidak disertakan. Maksimal 6.000 karakter konteks; jika terlalu panjang, pilih cuplikan yang lebih pendek. Tidak ada pemotongan diam-diam. Mengedit pesan secara manual mengubahnya menjadi chat biasa; gunakan tombol siapkan ulang untuk kembali ke proposal terstruktur.
5. Periksa batas output dan tarif, lalu **Tinjau request**. Centang persetujuan dan **Kirim satu request**. Request menggunakan provider Anda dan dapat dikenai biaya sesuai tarif layanan. Tidak ada retry/fallback otomatis.
6. Hasil JSON lengkap yang valid muncul pada **Review usulan canvas**. Periksa ringkasan, peringatan, seluruh aset dan setiap shot: aksi, dialog, suara, kamera, durasi dan referensinya. Estimasi potongan berbeda dari target durasi proyek.
7. Centang bahwa Anda sudah meninjau, lalu **Tambahkan sebagai draf**. Aset dan shot lama tetap tersedia; seluruh tambahan diterapkan bersama. Shot baru berstatus draf. Sunting melalui **Detail** dan review tiap shot sesuai kebutuhan. Periksa status simpan pada header; jika penyimpanan gagal, gunakan coba simpan lagi/backup sebelum menutup.

## Penolakan dan pemulihan
- Proyek berubah setelah pesan disiapkan (termasuk posisi node): siapkan usulan baru. Proposal lama tidak dapat diterapkan ke revisi/proyek lain.
- Respons terpotong, JSON tidak sesuai schema, referensi tidak ada atau dialog preserve bukan bagian sumber: tidak ada perubahan canvas. Sesuaikan cakupan/batas output lalu siapkan dan tinjau request baru; biaya request sebelumnya tidak dibatalkan oleh penolakan lokal.
- Usulan sudah diterapkan: tidak dapat ditambahkan dua kali, termasuk setelah reload/backup. Receipt tersimpan bersama draf.
- Request timeout/terputus: periksa pemakaian provider sebelum mengirim lagi; tidak ada kelanjutan otomatis.
- Menutup aplikasi menghilangkan usulan yang belum diterapkan dan percakapan sesi. Draf yang berhasil disimpan serta receipt tetap tersedia. Backup lama v1 masih dapat diimpor sebagai salinan.

## Batas checkpoint
Review ini hanya mengizinkan penambahan draf. Tidak mengesahkan kebenaran/kelengkapan cerita, kontinuitas, biaya produksi, atau hak akses media. Belum ada partial apply/diff penggantian, lampiran gambar ke LLM, compiler empat jenis prompt, proposal persisten/native, produksi media, hasil versi dan ekspor klip. Kontrol tersebut tidak diaktifkan hanya karena respons model berhasil. Kualitas dan kompatibilitas provider nyata belum diuji tanpa key dan persetujuan request pengguna.
