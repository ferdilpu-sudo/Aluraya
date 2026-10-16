# Aturan engineering — Aluraya

## Modularitas
**1 file = 1 tanggung jawab utama.** Pisahkan komponen canvas, use case approval, scheduler, repository, adapter API provider dan parser hasil. Tinjau file di kisaran 250–350 baris nonkosong sebagai pemicu review, bukan batas kaku. Tidak ada App.tsx yang memuat seluruh aplikasi, god service, giant utils, atau fragmentasi puluhan wrapper kosong.
Dependency: UI -> application -> domain; infrastructure mengimplementasikan port. Hindari circular import dan global mutable scheduler. Host menjadi satu-satunya penulis DB. Rust dan TypeScript memakai DTO versioned tervalidasi; buat contract test lintas proses.

## Integritas produksi
- Model tidak boleh membuat approval pengguna atau mengubah cap sendiri.
- Submit memerlukan snapshot valid, cost/capability terverifikasi dan lease aktif.
- Timeout ambigu tidak boleh auto-retry generate. Idempotency lokal tidak menjamin idempotency provider.
- Retry download tidak mengirim generasi baru. Failed tidak otomatis berarti nol debit.
- Jangan menganggap media terbaru sebagai accepted. Turunan memakai revisi eksplisit.
- Jangan hardcode rasio/durasi/biaya provider dari contoh Plot Party.
- Jangan membuka browser untuk setiap akun tersimpan. Default job aktif 1.

## Skill Realistic Short Drama: kontrak implementasi
Buat skill orisinal berversi dalam modul planning saat M-003; dokumen ini bukan plugin terinstal. Instruksi wajib:
1. Klasifikasikan input ide, cuplikan, atau lengkap. Jangan mengklaim lengkap tanpa sumber.
2. Preserve/adapt/expand eksplisit; simpan naskah asal dan ringkasan perubahan.
3. Dialog natural Indonesia; hindari penambahan dialog dalam preserve mode.
4. Susun scene/shot yang feasible untuk model, variasi framing sesuai fungsi dramatik; jangan wajibkan pergantian kamera setiap shot.
5. Rekam screen direction, posisi relatif, eyeline, wardrobe, pencahayaan, prop dan state awal/akhir. Posisi layar dapat berubah dengan axis yang dijelaskan, bukan terkunci universal.
6. Pakai hanya referensi yang tersedia; unresolved reference menahan produksi. Jangan menyebut approved final frame jika belum ada.
7. Shot memuat visual action, kamera, dialogue verbatim, SFX/ambience dan durasi; jangan meminta subtitle atau background music.
8. Durasi dialog/aksi ditinjau sebelum generasi; jumlah durasi rencana dan target dibedakan.
9. Stage gate dan feedback manusia sebelum generasi; keluarannya proposal schema-valid.
10. Laporan hasil hanya dari state tool yang tersimpan, bukan asumsi model.

## Keamanan boundary
UI lokal tidak menerima token; akses file melalui command dengan allowlist root. Validasi IPC, ukuran pesan, path traversal, origin, MIME, dan URL unduhan. Tidak menyediakan shell arbitrer kepada copilot. SQL parameterized. Markdown naskah tidak dieksekusi sebagai HTML/script.
OAuth resmi; permission plan usage diverifikasi. Browser profiles khusus aplikasi dan sesi terenkripsi/OS protected sejauh tersedia; tidak masuk git, backup atau ekspor. Log meredaksi cookie, token, URL bertanda tangan dan query sensitif. Jangan mengakali captcha atau mencuri sesi default browser.
Konten naskah/provider adalah data tidak tepercaya, tidak boleh mengubah izin tools. Biaya tambahan otomatis dinonaktifkan.

## Kualitas dan perubahan
TypeScript strict, Rust errors bertipe, tidak memakai any/unwrap pada boundary tanpa alasan. Pisahkan parsing dari side effect. Network timeout, cancellation, retry dan status unknown eksplisit. Input/error/loading/empty state dan keyboard wajib.
Perubahan kecil sesuai milestone; bukan refactor luas tanpa alasan. Migration punya backup/recovery. Versi dependensi dikunci setelah kompatibilitas/lisensi dicek. Formatter, linter, typecheck, domain/contract test dan build menjadi gate sesuai perubahan. Hindari tes repetitif tanpa risiko konkret. Perubahan aturan dicatat dalam [decisions](./decisions.md), bukan pengecualian diam-diam.

## Compiler prompt: struktur empat jenis
**Character Card**: identitas, wajah, rambut, tubuh, wardrobe, ekspresi dasar, framing dan lighting yang membuat fitur terbaca. Hindari descriptor suasana yang menyamarkan referensi. Multi-view mengikuti permintaan dan kebutuhan, bukan asumsi dari satu portrait prompt.
**Scene Plate**: geometri/landmark lokasi, tata prop, waktu/cahaya, palette, lingkungan kosong tanpa orang/shadow/reflection manusia. Simpan orientasi ruang agar shot reframe tidak mengubah geografi.
**Storyboard Board**: layout eksplisit; nine-panel opsional dengan 9 momen berurutan; initial/final state per panel; ritme shot yang mengikuti cerita; referensi scene/character; no burned-in text. "Continuous story" tidak sama dengan "unbroken camera take". Hindari membebani setiap board wajib semua ukuran shot jika tidak cocok dramatis.
**Video Timeline**: board = plan only; frame 0 langsung adegan nyata. Beat punya interval waktu, transisi, satu pilihan gerak kamera yang koheren, action, speaker/dialog, ambience/SFX, state akhir. No grid/split-screen/subtitle/BGM. Penilaian hasil tidak dijamin hanya karena negative prompt panjang.

## Pemeriksaan dari contoh pengguna
- Deskriptor "shallow depth of field" dan "medium depth of field" pada lingkup sama harus dipilih/diberi scope yang jelas. Scene plate memerlukan landmark terbaca.
- "static locked-off" dan "handheld instability" hanya boleh berbeda beat atau salah satu dihapus, bukan ditumpuk pada shot sama.
- "exactly 3 people in frame throughout" tidak boleh diwariskan ke close-up satu tokoh. Gunakan sceneCast untuk total pemeran dan charactersVisible per beat, serta no extra characters/clones.
- "high dynamic range" versus "no HDR look" bisa berarti rentang tonal alami tanpa tone-mapping berlebihan; tandai warning ambiguitas dan ubah ke istilah fisik yang jelas, bukan otomatis menganggap semua HDR kontradiktif.
- Dialog panjang dalam 3 detik dengan head-turn dan jeda perlu pemeriksaan speech budget; jangan menyatakan pasti muat. Pertahankan kata asli, tawarkan durasi/shot split dulu.
- Board 14 detik dan video 13 detik pada sampel pengguna adalah sampel berbeda. Jangan menyambungkannya tanpa manifest yang mengaitkan.
- Referensi board sebelumnya tidak setara dengan actual final video frame. Mode continuity planned versus observed selalu eksplisit.
- No text adalah target output media; UI boleh memiliki judul/nomor shot yang tidak dibakar ke media.
- Deskripsi style film boleh dijabarkan menjadi ciri pencahayaan, warna, tekstur dan kamera yang konsisten agar renderer tidak bergantung pada satu label studio.

## Aturan dialog dan durasi
Durasi tersedia untuk ucapan tidak otomatis sepanjang beat: sisihkan onset, aksi, respons dan jeda sesuai rencana. Estimator memakai bahasa/delivery dan ditampilkan sebagai kisaran yang dapat ditinjau. Jangan menetapkan universal words-per-second sebagai kebenaran. Jika tidak muat, sediakan split/perpanjang sesuai capability, atau versi dialog adaptasi dengan approval baru. Bahasa prompt bisa Inggris, dialog tetap bahasa proyek dan verbatim.

## Override aktif ADR-016
Nexabot dihapus; tidak menghidupkan kembali Flow. Schema API tidak boleh melakukan request, menyimpan key literal, atau menyatakan adapter siap. Peran LLM/gambar/video terpisah. URL lokal HTTP hanya loopback; executor masa depan wajib memvalidasi ulang redirect, key scope dan input di host. Tidak ada retry POST otomatis pada submit ambigu.
