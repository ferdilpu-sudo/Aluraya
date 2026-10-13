# Rencana implementasi — Aluraya

Strategi: buktikan integrasi mahal/berisiko terlebih dahulu, baru perluas studio. **M-001 In progress: fondasi TASK-002 tersedia, gate integrasi belum lulus. M-002–M-006 Not started.** ChatGPT sudah menghasilkan respons nyata di aplikasi Windows; integrasi Flow dan installer belum terbukti. Stack rekomendasi Tauri dapat ditinjau jika M-001 membuktikan hambatan signifikan.

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


## Checkpoint implementasi — 13 Oktober 2026

| Task | Status aktual | Bukti / pekerjaan tersisa |
|---|---|---|
| TASK-001 | PARTIAL | Kontrak dibaca; docs resmi ChatGPT/Flow/Tauri ditinjau. Lisensi runtime JS dikumpulkan. Audit lisensi Rust/media dan akses provider masih terbuka. |
| TASK-002 | PARTIAL | React canvas satu kartu, panel copilot, diagnostik, host Tauri dan sidecar ditulis. Format/lint/typecheck/20 tes/build JS PASS. Log dan screenshot pengguna membuktikan build debug Windows dan jendela aplikasi berhasil; round-trip host–sidecar PASS dari screenshot pengguna 18:26:55; CI native b3ae671 PASS. Installer belum diverifikasi. |
| TASK-003 | PASS — THIN SLICE LIVE | Screenshot 13 Oktober 09:18 memperlihatkan GPT-6.1-Sol menjawab pesan tes dan status Selesai. Simulasi kuota/pause tanpa fallback PASS pada fixture. Bukti dan batas: evidence/CHATGPT-ADAPTER-REPORT.md. Logout/restart/multiakun live belum dinilai. |
| TASK-004 | BLOCKED — GOOGLE LOGIN REJECTED | Screenshot pengguna 13 Oktober 14:26 membuktikan browser terbuka tetapi Google menolak login. Sandbox diperbaiki dan status penolakan dikenali. Biaya/capability, upload/submit/impor belum terbukti. Lihat evidence/FLOW-SETUP-REPORT.md. |
| TASK-005 | NOT IMPLEMENTED / LIVE NOT RUN | Video Flow dan impor otomatis belum dibuat; menunggu gambar pertama dan batch konkret. |
| TASK-006 | PARTIAL FOUNDATION ONLY | Framing IPC, penolakan command/field asing, korelasi respons dan penutupan child setelah EOF diuji. Ini bukan tes recovery submit produksi. |
| TASK-007 | BLOCKED GATE | M-001 belum lulus. Tidak melanjutkan ekspansi M-002 sebelum dependensi inti terbukti. |

Detail bukti awal: [evidence/M001-REPORT.md](./evidence/M001-REPORT.md); pembaruan startup: [evidence/WINDOWS-STARTUP-REPORT.md](./evidence/WINDOWS-STARTUP-REPORT.md). Round-trip host–sidecar sudah terbukti. ChatGPT thin slice live sudah lulus. Langkah terkecil berikut: TASK-004, siapkan profil Flow khusus dan pembacaan capability/biaya sebelum batch gambar disetujui. Source dipelihara di repository pengguna; tidak ada generasi berbayar yang dilakukan.


### TASK-002 — perbaikan startup Node Windows (12 Oktober 2026)

Laporan pengguna: `npm ci`, notices, dan build sidecar berhasil pada Node 24.19.0; persiapan berhenti karena skrip mengharuskan nama `LICENSE` persis di sebelah node.exe. Perbaikan memperluas nama file lokal dan mengambil lisensi resmi sesuai tag versi bila tidak ada, dengan cache per versi, timeout/batas ukuran dan validasi isi. Lisensi dipastikan tersedia sebelum file bundle dimutasi. Tidak memerlukan downgrade/upgrade npm atau instal ulang Node.

Source dipelihara di `https://github.com/ferdilpu-sudo/Aluraya`. Tes resolusi lisensi menggunakan layout instalasi tanpa LICENSE, cache offline, versi berbeda, respons HTML, file eksplisit, dan versi invalid. Build/startup Windows perlu dijalankan ulang setelah pull; M-001 tetap in progress.

### TASK-002 — startup berhasil dan perbaikan watcher (12 Oktober 2026)

Log lanjutan pengguna menunjukkan lisensi/runtime siap, build debug selesai dalam 7m 55s dan `aluraya.exe` berjalan. Screenshot memperlihatkan UI studio. Vite sekarang mengabaikan `src-tauri` untuk menghindari EBUSY pada DLL/EXE/PDB yang terkunci. Git attributes menetapkan LF agar checkout Windows konsisten dengan Prettier; CI sebelumnya berhenti pada format check. Pemeriksaan lokal lengkap PASS (20 tes); watcher aktif memantau frontend dan tidak memantau `src-tauri`. Konfirmasi hilangnya EBUSY di Windows, IPC host–sidecar, installer dan integrasi provider masih terbuka.

### TASK-003 — adapter dan panel chat (12 Oktober 2026)

Implementasi memakai protokol publik resmi secara langsung dan jose untuk validasi identitas. Tidak ada API key fallback, tool eksekusi atau Flow. Scope/identity, model discovery dan respons selesai merupakan status terpisah. Rincian perubahan, pemeriksaan dan batas: [evidence/CHATGPT-ADAPTER-REPORT.md](./evidence/CHATGPT-ADAPTER-REPORT.md). Langkah terkecil berikut adalah login dari tab Copilot pada Windows pengguna, lalu satu respons singkat. TASK-003 tetap belum lulus live; M-001 belum lulus.


### TASK-003 — kegagalan respons pertama (13 Oktober 2026)

Screenshot pengguna pukul 08:59 menampilkan GPT-6.1-Sol, Using ChatGPT plan, pesan `tes`, error umum dan jawaban kosong berlabel parsial. Ini bukti discovery/izin terlihat pada UI, bukan keberhasilan inference. Pemeriksaan sumber menemukan status HTTP/kode/parameter/Request ID dibuang saat error. Patch menambahkan rincian aman, mempertahankan status HTTP asli pada kegagalan SSE, dan membedakan jawaban kosong dari parsial. Request tetap mengikuti dokumentasi resmi; tidak mengganti model/endpoint berdasarkan tebakan. Perlu satu percobaan manual setelah pembaruan untuk mengetahui penyebab sebenarnya. M-001 tetap belum lulus.


### TASK-003 — perbaikan pembacaan stream (13 Oktober 2026)

Rincian pengguna mempersempit kegagalan ke guard sebelum body dibaca: HTTP 200/protocol/other. Adapter sekarang meminta SSE melalui Accept dan memeriksa format isi terbatas sebelum memilih parser; tidak langsung menolak stream valid hanya berdasarkan Content-Type. Error JSON/HTML/kosong tetap gagal dan rincian menampilkan media type. Pemeriksaan lokal PASS (61 tes, 1 Windows-only dilewati). Langkah berikut: satu pesan setelah restart build terbaru, lalu periksa jawaban selesai atau rincian aktual. Root cause isi layanan dan keberhasilan live belum terbukti.


### TASK-003 — respons live berhasil (13 Oktober 2026, 09:18 WIB)

Screenshot terbaru pengguna memperlihatkan model GPT-6.1-Sol, input `tes`, jawaban bahasa Indonesia yang utuh dan label Selesai. Thin slice login/izin, discovery dan satu inference dalam aplikasi dinyatakan PASS berdasarkan bukti pengguna; pause kuota tanpa fallback sudah diuji dengan fixture. Commit kandidat setelah perbaikan parser: 9775641; screenshot tidak memuat SHA executable sehingga tidak menjadi verifikasi hash build. Tidak mengulang tes chat rutin. Lanjut TASK-004: profil Flow khusus, capability/biaya, approval satu gambar, lalu impor otomatis. M-001 tetap in progress sampai gambar/video Flow dan gate terkait terbukti.


### TASK-004 — profil Flow dan observasi awal (13 Oktober 2026)

Tab Flow menambah daftar profil UUID persisten, pembukaan Chrome/Edge milik aplikasi, pemeriksaan read-only dan penutupan browser. Tidak memakai profil browser harian. Playwright Core 1.64.0 disertakan sebagai runtime eksternal; browser menggunakan instalasi pengguna. Snapshot hanya kandidat label model/kredit, bukan harga atau izin generasi. costVerified/generationReady selalu false dan IPC tidak memiliki command submit. Langkah terkecil: buka profil, login sendiri, buka proyek Flow, lalu Periksa halaman Flow; lihat docs/FLOW-START.md. Pengujian otomatis dan batas ada di evidence/FLOW-SETUP-REPORT.md.


### TASK-004 — penolakan login dan sandbox (13 Oktober 2026, 14:26 WIB)

Google menampilkan “Couldn't sign you in / This browser or app may not be secure” dan Chrome memperingatkan `--no-sandbox`. Penyebab penolakan tidak dapat disimpulkan hanya dari screenshot. Patch mengaktifkan `chromiumSandbox: true`, mengenali path sign-in rejected tanpa query/DOM login, memprioritaskan popup penolakan dan menampilkan arahan berhenti. Tidak ada retry dengan proteksi lebih lemah. CI setup sebelumnya gagal pada penolakan field asing di enum Rust tanpa payload; variant diganti menjadi empty struct agar `deny_unknown_fields` berlaku, dengan tes seluruh action tanpa payload.

TASK-004 tetap BLOCKED sesuai kondisi berhenti AGENTS.md. Langkah berikutnya adalah memastikan jalur akses yang didukung provider; tidak melanjutkan submit/generasi atau ekspansi studio. Tidak menyalin sesi harian, menyamarkan automation, atau mengganti kredit Flow dengan API berbayar. Instruksi login pada checkpoint lama adalah riwayat, bukan permintaan mengulang login yang ditolak.


### TASK-004 — konfirmasi blocker (13 Oktober 2026, 14:43 WIB)

Screenshot kedua tetap menunjukkan penolakan Google; peringatan no-sandbox tidak terlihat. Profil aktif/browser terbuka bukan login sukses, dan status jenis halaman diperbarui lewat tombol Periksa halaman Flow. TASK-004 tetap BLOCKED. CI commit 0f163ae SUCCESS: 72 tes JS Windows, 8 tes Rust, release executable dibangun; installer serta akses Flow tetap belum terbukti. Bukti lengkap: evidence/FLOW-SETUP-REPORT.md. Langkah terkecil: simpan status penolakan lalu tutup browser milik aplikasi; pastikan jalur akses yang didukung sebelum mengembangkan submit.


### TASK-004 — evaluasi jalur resmi (13 Oktober 2026, 15:27 WIB)

Riset primer menemukan Flow Agent/Tools yang memakai kredit Flow di proyek Flow, serta Gemini API generasi dengan billing tersendiri. Tidak ditemukan kontrak integrasi publik yang membuktikan pemakaian kredit Flow sekaligus hasil otomatis ke canvas Aluraya. Pilihan konkret, konsekuensi REQ-007/AC-007 dan slice pertama disiapkan di [docs/FLOW-INTEGRATION-DECISION.md](./docs/FLOW-INTEGRATION-DECISION.md). Status PROPOSAL; belum mengubah kebutuhan atau mengaktifkan fallback. AGENTS.md mensyaratkan keputusan pengguna untuk revisi produk besar/biaya nyata. TASK-004 tetap BLOCKED sampai jalur akses terbukti atau perubahan scope dipilih.


### Keputusan pengguna — pilihan A (13 Oktober 2026, 19:21 WIB)

Pengguna memilih mempertahankan spesifikasi awal. REQ-007/AC-007 tetap: Flow otomatis memakai akun/kredit Flow dan hasil langsung masuk canvas Aluraya. Mode pendamping manual dan adapter API berbayar tidak dipilih. TASK-004 tetap BLOCKED oleh akses login provider; M-001 belum lulus. Kelanjutan modul memerlukan bukti jalur akses yang didukung dan bekerja, kemudian capability/biaya serta approval batch konkret. Rincian keputusan ada di docs/FLOW-INTEGRATION-DECISION.md. Ini pembaruan dokumentasi, bukan keberhasilan integrasi atau izin pengeluaran.


### TASK-006 — installer Windows independen dari login Flow (13 Oktober 2026)

Pilihan A tetap berlaku dan TASK-004 tetap BLOCKED. Pekerjaan M-001 dilanjutkan pada packaging: workflow membangun NSIS, memasang pada runner Windows sementara, membandingkan resource/runtime, menguji IPC sidecar terpasang tanpa akun, lalu uninstall. Hasil di evidence/WINDOWS-INSTALLER-REPORT.md dan artifact installer-check.json. Ini bukan ekspansi studio atau bukti login/generasi berhasil. GUI, upgrade, recovery dan RAM masih menunggu bukti tersendiri.
