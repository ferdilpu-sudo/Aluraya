# PRD — Aluraya

## Status dan tujuan
Kebutuhan dikonfirmasi 11 Oktober 2026 dan dipulihkan dari ZIP pengguna pada 17 Oktober 2026. Implementasi aktif kembali ke fondasi M-001 a8f9e2e; M-001 belum lulus karena Flow masih terblokir. Pemilik produk: pengguna. Target satu pengguna pribadi di Windows, tanpa server/cloud hosting milik aplikasi. Mengurangi perpindahan manual antara chat, referensi, storyboard, dan Flow.

## Lingkup
MVP mencakup seluruh kebutuhan Must dalam tabel. Hasil akhir klip per shot dengan dialog/SFX, bukan episode yang sudah diedit. Tidak termasuk musik, subtitle, editor timeline lengkap, publikasi, marketplace, pembayaran, kolaborasi, aplikasi mobile, maupun generasi AI lokal. Akun Flow campuran didukung sesuai kemampuan aktual masing-masing.

## Alur utama
1. Buat proyek dari ide/naskah; pilih rasio, target durasi, dan mode adaptasi. Copilot mengajukan rencana; pengguna menyetujui.
2. Unggah atau buat karakter/lokasi/prop lewat Flow; pilih versi master; setujui aset. Susun storyboard dan shot; setujui.
3. Pilih shot/batch, lihat biaya serta batas percobaan, setujui. Sistem menjalankan Flow; hasil masuk otomatis ke canvas.
4. Tinjau dialog, SFX dan visual; terima versi atau revisi shot. Ekspor klip untuk editing di aplikasi lain.
5. Jika akun habis kredit, pilih akun layak berikutnya dalam cakupan persetujuan; jika semua tidak layak, pause dengan alasan. Login/captcha perlu tindakan pemilik, bukan pekerjaan produksi manual.

## Kebutuhan Must
| ID | Perilaku | Prioritas | Aktor | Penerimaan |
|---|---|---|---|---|
| REQ-001 | Proyek dari ide atau naskah lengkap | Must | Pemilik | AC-001 |
| REQ-002 | Copilot di aplikasi memakai paket ChatGPT | Must | Pemilik | AC-002 |
| REQ-003 | Canvas produksi interaktif | Must | Pemilik | AC-003 |
| REQ-004 | Aset unggahan dan generasi Flow | Must | Pemilik | AC-004 |
| REQ-005 | Skill drama dan rencana shot | Must | Pemilik | AC-005 |
| REQ-006 | Persetujuan bertahap dan biaya | Must | Pemilik | AC-006 |
| REQ-007 | Flow otomatis sampai hasil di canvas | Must | Pemilik | AC-007 |
| REQ-008 | Banyak akun dan round robin | Must | Pemilik | AC-008 |
| REQ-009 | Klip berdialog dan SFX | Must | Pemilik | AC-009 |
| REQ-010 | Antrean tahan restart dan kegagalan ambigu | Must | Pemilik | AC-010 |
| REQ-011 | Versi dan dependensi kontinuitas | Must | Pemilik | AC-011 |
| REQ-012 | Rasio dan durasi proyek | Must | Pemilik | AC-012 |
| REQ-013 | Ekspor klip per shot | Must | Pemilik | AC-013 |
| REQ-014 | Pengoperasian pada laptop 8 GB | Must | Pemilik | AC-014 |
| REQ-015 | Penyimpanan lokal dan pemulihan | Must | Pemilik | AC-015 |

| REQ-016 | Empat kelas prompt, manifest referensi, dan lint konsistensi | Must | Pemilik | AC-016 |

## Kriteria penerimaan
- **AC-001**: Ide dan naskah Fountain/teks dapat menjadi proyek; sumber asli tetap tersimpan. Mode adaptasi harus dipilih sebelum memendekkan atau menambah cerita.
- **AC-002**: Login resmi dengan izin penggunaan paket berhasil dan respons tampil dalam aplikasi. Saat kuota habis pekerjaan berhenti; tidak ada fallback berbayar atau pembelian otomatis.
- **AC-003**: Pengguna dapat pan/zoom, pilih banyak node, kelompokkan, atur otomatis, dan membuka detail. Posisi serta hubungan pulih setelah restart.
- **AC-004**: Gambar unggahan atau hasil Flow dapat dipilih sebagai versi referensi karakter/lokasi/prop. Impor tidak mengubah berkas sumber pengguna.
- **AC-005**: Naskah menghasilkan daftar adegan/shot dengan dialog, SFX, kamera, durasi estimasi, referensi dan kontinuitas. Kekurangan sumber ditandai; tidak diklaim sebagai naskah lengkap.
- **AC-006**: Naskah, aset, storyboard, serta batch generasi memiliki persetujuan tersendiri. Submit ditolak jika persetujuan tidak cocok dengan versi input/model/biaya.
- **AC-007**: Dari batch disetujui, aplikasi mengunggah referensi, mengirim, memantau, mengambil media dan menampilkan preview tanpa pengguna menyalin prompt atau mengunduh hasil di browser.
- **AC-008**: Tidak ada batas jumlah akun buatan produk. Akun aktif dengan saldo cukup dan kemampuan sesuai dipilih bergiliran; kredensial/profil tidak tercampur.
- **AC-009**: Setiap klip memiliki prompt dialog verbatim dan SFX, tanpa permintaan musik/subtitle. Hasil dapat diputar dan dinilai manusia; ketidaksesuaian bisa direvisi per shot.
- **AC-010**: Restart saat submit ambigu menghasilkan rekonsiliasi, bukan submit ulang otomatis. Selesainya media di provider tidak diklaim siap sebelum impor lokal berhasil.
- **AC-011**: Perubahan aset menandai hanya turunannya yang relevan sebagai usang; tidak menghapus hasil lama. Shot dependent menunggu last frame dari versi hasil yang diterima.
- **AC-012**: 9:16 atau 16:9 dipilih per proyek; target durasi dan jumlah durasi shot ditampilkan terpisah. Model yang tidak mendukung konfigurasi diblokir sebelum submit.
- **AC-013**: Klip terpilih dan metadata prompt/shot dapat diekspor dalam urutan scene-shot; nama tidak bertabrakan dan berkas asli tidak tertimpa diam-diam.
- **AC-014**: Default satu job dan satu profil Flow aktif; banyak akun tersimpan tidak membuka banyak browser. Video hanya dimuat saat diperlukan; aplikasi tetap menerima pause saat job berlangsung.
- **AC-015**: Proyek dapat dibuka offline untuk edit/preview lokal. Backup dapat dipulihkan tanpa token/profil login. Migrasi gagal tidak merusak database yang masih valid.

## Batas nonfungsional
- Ukur respons UI dan seluruh proses aplikasi/browser pada perangkat sasaran, jangan hanya proses shell.
- Target awal engineering, belum benchmark: canvas 200 node/300 edge berbasis thumbnail tetap bisa dipakai; tanggapan interaksi p95 di bawah 200 ms saat satu job aktif. Angka boleh disesuaikan setelah baseline dengan alasan terdokumentasi.
- Tidak ada janji wajah, lip-sync, suara atau SFX sempurna; penerimaan media oleh manusia. QA gambar AI bersifat bantuan.
- Data proyek lokal; hanya konteks/referensi yang diperlukan dikirim ke provider. Login/session tetap terpisah dari ekspor.
- Tidak ada limit akun produk; hardware dan batas provider tetap berlaku. Kuota bersama antarakun harus diketahui agar tidak dihitung ganda.

## Asumsi dan hal terbuka
Asumsi: bahasa dialog Indonesia, prompt produksi boleh Inggris, gaya awal cinematic realistic, nama produk Aluraya. Semua dapat diubah per proyek. Stack Tauri direkomendasikan setelah melihat RAM 8 GB, belum dikonfirmasi sebagai preferensi final pengguna.
Terbuka untuk M-001, pemilik coding agent: akses paket ChatGPT akun aktual; jalur otomatisasi Flow yang diizinkan dan bekerja; pembacaan saldo, kemampuan model, korelasi hasil dan unduhan. Jika terhalang, hentikan bagian terkait dan laporkan, bukan mengasumsikan dukungan.

## Ukuran keberhasilan
Satu proyek lengkap melewati persetujuan sampai satu gambar dan satu klip nyata muncul otomatis di canvas; recovery tidak membuat submit duplikat; ekspor bisa dibuka; penggunaan laptop memenuhi hasil uji yang disepakati. Traceability di [testing](./testing.md), urutan di [plan](./plan.md).

## AC-016 — prompt produksi terstruktur
Diberi rencana adegan dan referensi valid, aplikasi menyusun Character Card, Scene Plate, Storyboard Board dan Video Timeline sebagai dokumen terpisah yang dapat diedit. Setiap label ReferenceN cocok dengan file, peran, revisi, dan urutan upload aktual. Referensi unresolved, timeline bercelah/overlap, model tidak mendukung konfigurasi, atau kontradiksi hard constraint menahan submit. Peringatan estimasi kepadatan dialog dapat direvisi atau diakui pengguna; bukan jaminan audio muat. Mengedit prompt/ref setelah approval membuat approval usang.
Board 3x3 sembilan panel adalah pilihan workflow yang didukung, bukan default wajib setiap proyek. Video tidak boleh menampilkan grid atau storyboard sebagai frame pembuka. Penggunaan board sebagai referensi rencana hanya jika adapter/model mendukung cara tersebut; kalau tidak, rencana perlu disesuaikan dan disetujui, bukan memakai board sebagai start frame.

## Sumber tambahan dari pengguna
Empat contoh prompt 11 Oktober 2026 menunjukkan urutan momen, scene plate kosong, identitas karakter, timeline video, speaker lock dan no-BGM. Board contoh menggambarkan akhir pelarian, sedangkan video contoh menggambarkan kedatangan; keduanya sampel terpisah dan tidak boleh dianggap input/output satu generasi yang sama. Nama/umur/wardrobe contoh bukan data karakter wajib untuk semua proyek.
