# Rencana implementasi — Aluraya

Strategi: buktikan integrasi mahal/berisiko terlebih dahulu, baru perluas studio. Semua milestone **Not started**. Tidak ada kode aplikasi dalam paket ini. Stack rekomendasi Tauri dapat ditinjau jika M-001 membuktikan hambatan signifikan.

| ID | Sasaran | Dependensi | Deliverable | Requirement | Exit gate |
|---|---|---|---|---|---|
| M-001 | Dua integrasi dan hasil otomatis | Tidak ada | Thin slice Windows, login ChatGPT, satu gambar/klip Flow ke kartu | REQ-002, REQ-007, REQ-014 | Live login/inference, gambar/video muncul otomatis, ukur total proses |
| M-002 | Proyek dan canvas persisten | M-001 | SQLite, node/edge, impor media, backup dasar | REQ-001, REQ-003, REQ-004, REQ-015 | Restart/offline memulihkan proyek dan media |
| M-003 | Planner dan approval | M-002 | Skill berversi, scene/shot, proposal, approval snapshot | REQ-005, REQ-006, REQ-012 | Input cuplikan tak dianggap lengkap; stale approval diblokir |
| M-004 | Scheduler multiakun dan recovery | M-003 | Credit observation/reservation, round robin, reconcile | REQ-008, REQ-010 | Fault setelah submit tidak menggandakan generasi |
| M-005 | Kontinuitas, review dan ekspor | M-004 | Last frame, accepted version, feedback, ekspor | REQ-009, REQ-011, REQ-013 | Klip nyata dapat direview/diterima/ekspor; referensi tepat |
| M-006 | Paket Windows dan penerimaan | M-005 | Installer pribadi, restore, profiling, keyboard QA | Semua REQ | Seluruh AC dan batas hardware diverifikasi |

## M-001: urutan executable
- TASK-001: baca seluruh kontrak; periksa repo bila diberikan. Revalidasi dokumen resmi login ChatGPT, batas Flow, browser yang didukung, lisensi sidecar/media. Catat bukti/versi di decisions.
- TASK-002: scaffold Tauri/React/TypeScript dengan satu kartu, panel chat, bridge terbatas dan sidecar. Buat planned scripts README menjadi benar-benar runnable. Build Windows dan kemas sidecar sederhana.
- TASK-003: jalankan sign-in resmi dengan akun pengguna; verifikasi izin plan usage; discovery model; satu respons streaming di panel chat. Simulasikan kuota habis untuk memastikan pause tanpa fallback biaya.
- TASK-004: siapkan satu profil Flow khusus; login sendiri. Buktikan capability/cost observation, unggah satu reference, submit satu gambar setelah approval biaya eksplisit. Ambil output otomatis, hash, metadata, thumbnail dan kartu.
- TASK-005: ulangi thin slice video dengan dialog/SFX pendek yang disetujui pengguna. Catat cara korelasi job/result dan jalur download yang diizinkan. Buktikan polling serta preview video/audio dalam canvas.
- TASK-006: putus koneksi secara terkendali atau pakai fixture setelah submit. Validasi status uncertain dan tidak auto-resubmit. Uji packaging dan ukur RAM seluruh proses pada laptop 8 GB.
- TASK-007: laporkan hasil gate. Jika akses login/Flow/unduhan gagal, tandai BLOCKED dengan bukti; jangan membangun fitur penuh di atas adapter mock dan menyebut otomatisasi selesai.
M-001 dapat memakai schema minimal tetapi approval biaya eksplisit tetap wajib. Budget live belum ditentukan, jadi tidak ada izin menjalankan pengeluaran dari dokumen ini sendiri.

## Pekerjaan berikutnya
M-002: impor aman dan source preservation; layout dan edge; schema migration/backup; preview lokal. M-003: mode adaptasi dan versioning skill; DTO proposal; dialog natural; referensi terikat; approval UI yang host-validates. M-004: banyak profil tersimpan, pool-aware reservation, lease, pause/reconcile, error state. M-005: last frame dari accepted output, invalidation, ekspor. M-006: ukur dan perbaiki bottleneck nyata; tidak menambah timeline/subtitle/musik.

## Risiko dan respons
- Integrasi Flow UI berubah: adapter versioned, fail dengan PROVIDER_CHANGED, simpan job dan aset. Tidak ada fallback manual diam-diam.
- Kuota ChatGPT: pause dengan usage action, resumable; tidak beralih biaya.
- RAM 8 GB: satu profil/job, thumbnail, tidak autoplay; ukur sebelum menambah concurrency.
- Korelasi hasil lemah: uncertain tetap membutuhkan rekonsiliasi; matching prompt/waktu saja tidak cukup jika beberapa hasil identik.
- Kualitas karakter/dialog: master references dan human review; budget retry terbatas.
- Disk penuh: tunda download dan simpan provider reference; jangan generate ulang.

## Pelaporan
Update status milestone hanya dengan bukti. Pisahkan Verified (kode dan hasil diuji), Blocked, dan NOT RUN. Setelah tiap milestone laporkan fitur pengguna yang berfungsi, tes relevan, risiko dan langkah berikutnya. Tidak ada estimasi waktu palsu; effort ditaksir setelah M-001.

## Tambahan v1.1 untuk M-003 (REQ-016)
TASK-008: definisikan PromptDocument, ReferenceManifest, StyleRevision dan PromptValidation beserta migrasi. TASK-009: implementasikan compiler pure empat tipe dan mapping upload provider; setiap template diberi versi. TASK-010: implementasikan lint formal dan warnings semantik dengan fixture TEST-016. TASK-011: bangun Prompt Inspector dan hash approval yang mengikat teks edit/ref/capability. Exit M-003 juga mensyaratkan TEST-016 lulus; live output tanpa grid diperiksa pada M-005 bersama TEST-009. Tidak menambah milestone terpisah atau generasi live otomatis.
