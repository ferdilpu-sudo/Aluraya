# Desain interaksi — Aluraya

## Prinsip
Canvas adalah alat produksi; chat dapat mengusulkan perubahan pada node terpilih, tetapi state produksi dimiliki aplikasi. Referensi tampilan adalah screenshot pengguna: aset atas, storyboard tengah, video bawah, copilot kanan. Buat desain orisinal tanpa menyalin logo atau aset Plot Party.

## Navigasi dan layar
| ID | Layar | Elemen utama | Kebutuhan |
|---|---|---|---|
| UI-001 | Beranda proyek | Baru, buka, pulihkan backup, proyek terakhir | REQ-001, REQ-015 |
| UI-002 | Workspace | Canvas, panel copilot, toolbar, daftar shot, antrean | REQ-003, REQ-005 |
| UI-003 | Detail node | Prompt, referensi, dialog/SFX, versi, preview, status | REQ-004, REQ-009, REQ-011 |
| UI-004 | Persetujuan batch | Ringkasan perubahan, model, durasi, kredit, akun layak, retry | REQ-006, REQ-012 |
| UI-005 | Akun dan penggunaan | Tambah/login ulang, saldo beserta waktu observasi, capabilities | REQ-002, REQ-008 |
| UI-006 | Ekspor | Versi terpilih, folder tujuan, urutan dan konflik nama | REQ-013 |

## Canvas dan copilot
Kartu: naskah, karakter, lokasi, properti, storyboard/shot, hasil video. Group per scene; minimap, auto-arrange, pencarian node, zoom-to-selection. Garis reference, continuity dan sequence memiliki label, bukan warna saja. Board sembilan panel adalah tampilan opsional dari shot; bukan unit wajib generasi.
Panel kanan: percakapan, pilihan target node, ringkasan perubahan, tombol tinjau/setujui. Copilot menampilkan perubahan sebagai proposal terstruktur. Hasil tool ditampilkan berdasarkan state tersimpan; pesan bahasa alami tidak boleh mengklaim berhasil sebelum event hasil nyata.
Canvas boleh memakai tema terang netral seperti referensi, aksen tunggal, spacing 8 px; ini usulan visual, bukan keputusan merek. Panel dapat diciutkan pada layar kecil. Daftar shot alternatif wajib tersedia agar pengguna tidak hanya bergantung pada drag canvas.

## Persetujuan
Tampilkan versi naskah/asset/prompt, model, rasio, durasi, jumlah output, estimasi per generation dan total, batas percobaan, account pool serta kebijakan perpindahan akun. Perubahan biaya melebihi cap atau perubahan model meminta persetujuan baru. Saldo belum diketahui tidak boleh ditampilkan sebagai nol atau cukup; tombol produksi menunggu validasi saldo/biaya.
Setujui tahap aset bukan persetujuan otomatis video. Biaya generasi aset juga membutuhkan approval batch sebelum submit. Persetujuan produksi berlaku untuk input yang terlihat; edit berikutnya menandai stale.

## Status dan error
Pisahkan badge tahap, job, kualitas hasil dan freshness. Contoh: menunggu persetujuan, antre, menunggu referensi, dikirim, diproses provider, status belum jelas, mengunduh, siap ditinjau, diterima, gagal, perlu login, saldo tidak cukup, usang. Progress tidak memakai persentase palsu; tampilkan fase bila provider tidak menyediakan angka.
Pause menghentikan submit baru; job terlanjur dikirim tetap dipantau. Cancel menjelaskan bahwa biaya/provider generation yang sudah terjadi tidak otomatis bisa dibatalkan. Retry download tidak mengulang generate.
Saat tidak online, edit/preview lokal tetap tersedia; generate dinonaktifkan dengan alasan. Jika login diperlukan, buka profil khusus; setelah login alur kembali ke canvas. Tidak menyediakan copy-paste manual sebagai pemenuhan fitur otomatisasi.

## Preview dan ekspor
Thumbnail untuk node yang tidak diputar. Hanya satu video aktif secara default; matikan autoplay seluruh canvas. Klip memiliki player dengan audio, versi hasil dan opsi diterima/perlu revisi. Dialog/SFX bisa tidak sesuai hasil prompt; pengguna memberi feedback dan menyetujui retry. Musik/subtitle manual di luar aplikasi.
Ekspor klip sesuai pilihan ke scene-shot-version.mp4 bersama metadata JSON; jangan membuat timeline editor sebagai scope tambahan.

## Aksesibilitas dan Windows
Keyboard Tab, Enter, Space, Escape; fokus kembali setelah modal ditutup. Label screen reader untuk node/status/tombol. Kontras teks minimal 4.5:1, tidak hanya warna. Uji DPI 100/150%, resize, touch dasar; drag memiliki alternatif tombol/daftar. Penghapusan node tidak langsung menghapus media fisik; tampilkan dampak ke dependensi.

## Prompt Inspector dan review (REQ-016)
Detail node menyediakan tab Struktur, Prompt final, Referensi, dan Pemeriksaan. Referensi menampilkan thumbnail, role, revisi, dan slot upload aktual. Pengguna dapat membuka board 3x3 dengan label panel hanya di UI; gambar yang diekspor tetap tanpa teks jika textPolicy none. Panel diagram UI bukan bagian dari input gambar final.

Video timeline berbentuk daftar beat bertimestamp: framing, kamera, siapa terlihat, siapa berbicara, dialog, ambience dan SFX. Ini editor rencana, bukan editor video penuh. Tampilkan perkiraan durasi dialog di samping jatah waktu; teks "perkiraan" wajib. Copilot menawarkan memperpanjang klip, membagi shot, atau mengadaptasi dialog; perubahan dialog preserve mode memerlukan keputusan pengguna.

Lint menampilkan konflik dengan lokasi field dan usulan perbaikan. Contoh: "locked-off dan handheld pada beat yang sama", "semua 3 orang wajib terlihat tetapi shot meminta wajah tunggal", "shallow dan medium depth of field sekaligus", atau reference slot tanpa attachment. Tidak memperbaiki cerita/blocking diam-diam. Hard blocker menonaktifkan Generate; warning yang dapat diterima dicatat bersama approval. Timeline multi-cut dan one-take tidak boleh aktif sekaligus.


## Workspace aktif — 16 Oktober 2026
Canvas tunggal: naskah dan aset di atas, storyboard di tengah, slot hasil di bawah. Navigasi Naskah/Aset/Storyboard/Hasil memusatkan viewport, bukan mengganti halaman. Copilot di kanan menjadi titik awal; Detail menyunting node yang dipilih dan Koneksi API mengatur profil per peran. Panel dapat ditutup pada layar kecil. Pencarian shot, minimap, pan/zoom, multi-select dan rapikan tetap tersedia. Kelompok scene serta versi hasil belum selesai; usulan tambahan aset/shot tersedia melalui review PLAN-001.

Editor naskah/aset/shot manual adalah fasilitas pendukung dalam panel detail. Draf IndexedDB dan backup JSON dipertahankan kompatibel. Siapkan usulan menyusun pesan dari sumber eksplisit; review biaya dan kirim tetap langkah terpisah. Hasil yang valid menampilkan seluruh aset/shot untuk ditinjau sebelum Tambahkan sebagai draf; tidak ada penggantian atau partial apply. Slot hasil berlabel Belum diproduksi. Jangan membuat hasil demo terlihat sebagai generasi nyata. Pilihan protokol/config disimpan tanpa key; tidak menampilkan Terhubung hanya karena JSON valid. API key Chat Completions dimasukkan lewat password field satu arah dan disimpan DPAPI native; protokol/media lain belum mempunyai executor.
