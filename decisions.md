# Keputusan — Aluraya

Tanggal seluruh catatan: 11 Oktober 2026. Accepted berarti kebutuhan eksplisit pengguna; Proposed berarti rekomendasi teknis untuk dibuktikan, bukan persetujuan preferensi yang diada-adakan.

| ADR | Status | Keputusan | Terkait | Pemicu tinjau ulang |
|---|---|---|---|---|
| ADR-001 | Proposed | Tauri + React/TS + sidecar Node | REQ-003, REQ-014 | integrasi/packaging/benchmark gagal |
| ADR-002 | Accepted | Windows pribadi dan data lokal | REQ-015 | distribusi berbayar/multiuser |
| ADR-003 | Accepted kebutuhan; integrasi belum diuji | ChatGPT dalam aplikasi tanpa tagihan API | REQ-002 | akses paket tidak tersedia |
| ADR-004 | Accepted kebutuhan; adapter belum diuji | Flow otomatis, hasil langsung canvas | REQ-007 | akses automation tidak didukung |
| ADR-005 | Accepted | Akun tanpa cap produk, round robin layak | REQ-008 | perubahan credit pooling |
| ADR-006 | Accepted | Persetujuan bertahap dan klip per shot | REQ-006, REQ-009 | pengguna meminta full editor |
| ADR-007 | Proposed | SQLite dan media terpisah | REQ-010, REQ-015 | multiuser cloud |
| ADR-008 | Proposed | Skill orisinal sebagai konfigurasi berversi | REQ-005 | workflow baru |

## ADR-001 — shell desktop
Pilihan: Electron/React (ekosistem TS paling langsung; runtime lebih besar), Tauri/React (WebView sistem, tetapi Rust + sidecar menambah packaging), .NET/WebView2/React (Windows kuat, dua ekosistem juga). Rekomendasi berubah dari Electron ke Tauri setelah perangkat RAM 8 GB diketahui. Tidak mengklaim benchmark RAM yang belum diukur. Canvas React dapat dipertahankan bila shell harus berubah. Mulai dengan 1 profil/job aktif; optimasi total proses lebih penting daripada ukuran shell saja. Owner: coding agent memvalidasi M-001; perubahan stack besar dijelaskan ke pengguna.

## ADR-002 — lokal dan pribadi
Pengguna memilih Windows untuk pribadi. Server cloud versus lokal: lokal dipilih agar media, browser dan sesi berada pada laptop serta tidak menambah hosting. Konsekuensi: laptop harus aktif saat produksi; aplikasi tertutup tidak mengirim job baru. Windows LTSC memerlukan pemeriksaan WebView2 Runtime, bukan asumsi sudah tersedia.

## ADR-003 — ChatGPT plan usage
Pilihan: API key berbayar (tidak memenuhi constraint), plugin di ChatGPT (tidak memenuhi lokasi chat), sign-in resmi untuk proyek lokal (direkomendasikan). Dokumentasi resmi mendeskripsikan jalur terakhir; akun aktual belum diuji. Gunakan kuota paket; tidak membeli kredit/fallback biaya. Jika akses tidak berhasil, tandai blocker, jangan menyulap login menjadi entitlement. Distribusi komersial memerlukan penilaian ulang ketersediaan integrasi.

## ADR-004 — Flow
Pilihan: API video resmi terpisah (belum terbukti memakai kredit Flow), browser adapter (sesuai arah yang diizinkan pengguna), manual copy/download (tidak memenuhi kebutuhan). Browser adapter diusulkan, tidak mengklaim API Flow resmi tersedia. M-001 membuktikan login, input referensi, submit, korelasi hasil, unduhan dan preview. Jika tidak bisa, laporkan batas konkret; jangan bypass proteksi atau diam-diam menjadikan manual fallback sebagai selesai.

## ADR-005 — akun dan kredit
Tidak ada cap jumlah akun tersimpan. Alternatif membuka semua profil ditolak karena RAM 8 GB dan tidak diperlukan. Eligibility lalu round robin, dengan capability/cost per akun. Akun berbeda bisa berbagi pool, jadi saldo tidak selalu dapat dijumlahkan. Concurrency default 1, configurable setelah pengukuran dan batas provider. Pergantian akun hanya untuk kredit/availability yang sah, bukan menghindari penolakan keamanan/rate enforcement.

## ADR-006 — produksi bertahap
Naskah/aset/storyboard/generasi masing-masing perlu persetujuan. Approval snapshot dan cap kredit/retry dipilih ketimbang izin terbuka selamanya. Musik/subtitle/timeline editor tidak termasuk. Board 9-panel opsional; satu board tidak berarti satu klip 15 detik. Human review mempertahankan kontrol kualitas dialog dan SFX.

## ADR-007 — persistence
SQLite versus JSON-only: SQLite dipilih untuk transaksi job/reservasi/recovery; file media tetap di filesystem agar DB ringan. Konsekuensi: migrasi, backup DB konsisten dan manifest media wajib. JSON-only hanya untuk ekspor, bukan source of truth.

## ADR-008 — skill
Buat aturan orisinal dari contoh alur yang diberikan. Jangan mengklaim mengetahui instruksi internal Plot Party. Skill version ikut snapshot produksi. Planner boleh menyarankan; host mengontrol izin. Skill tidak boleh memutuskan saldo, keberhasilan job, atau memberi approval kepada dirinya sendiri.

## Terbuka yang ditangani melalui pembuktian
Akses ChatGPT aktual; kompatibilitas Flow automation; observer kredit/cost; metadata provider untuk reconcile; kemasan sidecar pada laptop; ruang disk dan RAM baseline. Owner coding agent M-001. Asumsi dokumentasi ini bukan bukti dukungan provider.

## ADR-009 — nama produk (Accepted)
Pengguna memilih Aluraya pada 11 Oktober 2026. Nama lengkap Aluraya Studio; tagline Dari naskah menjadi adegan; repository aluraya. Menggantikan nama kerja DramaCanvas. Ini keputusan nama, bukan klaim merek/domain tersedia.

## ADR-010 — prompt terstruktur dan lint (Proposed implementation)
Sumber: empat contoh prompt yang diberikan pengguna. Opsi: satu prompt bebas panjang versus empat tipe dokumen dengan manifest dan compiler. Pilih tipe terstruktur agar reference order, timeline dan approval dapat diaudit. Teks final tetap dapat diedit tetapi edit mengharuskan revalidasi. Board 3x3 didukung sebagai pilihan; tidak dipaksakan menjadi video 13/14/15 detik atau satu take.
Konsekuensi: tambah REQ-016 dan kontrak schema, validator, inspector UI serta test fixture. Pemeriksaan formal tidak menjamin generasi patuh. Revisit jika kemampuan model mengharuskan input berbeda; perubahan diterjemahkan adapter atau diajukan sebagai rencana baru, tidak menghilangkan referensi diam-diam.


## ADR-011 — fondasi M-001 (12 Oktober 2026; implemented partial)

Tetap memakai rekomendasi Tauri/React tanpa memperluas scope. Versi JavaScript tepat ada di package.json dan package-lock.json. Node runtime untuk sidecar dipaketkan bersama bundle dari instalasi Node 24 x64 pembangun, dengan SHA-256 dan lisensi. Sidecar adalah satu proses persistent untuk diagnostik saja; belum ada adapter provider, database, maupun generasi.

Batas IPC: LF-framed JSON 64 KiB, command allowlist health.inspect, timeout host 8 detik, request ID UUID dan validasi ulang dua sisi. Ini keputusan teknis reversibel untuk TASK-002. Tanpa SQLite pada checkpoint scaffold ini; ownership host tunggal dan schema M-001 tetap berlaku saat mulai menyimpan state produksi. Jangan menganggap kartu placeholder sebagai hasil Flow.

Lingkungan implementasi Linux/Node 24.19.0 tidak memiliki cargo/rustc. Cargo.toml masih constraint major kompatibel dan Cargo.lock belum tersedia: resolusi, lisensi dan lock native wajib diselesaikan dalam build Windows pertama. Packaging serta seluruh process tree belum diukur. Tidak ada klaim keunggulan RAM berdasarkan stack saja.

## Revalidasi sumber TASK-001 (11 Oktober 2026)

- [ChatGPT sign-in cookbook](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt): jalur personal/local tersedia secara dokumentasi; entitlement akun belum dibuktikan.
- [Registration](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) dan [models/inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference): OAuth/izin plan usage dan discovery harus dipisahkan dari identitas. Jangan hardcode model atau menambahkan API key fallback.
- [Preview limits](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations): perlu dipertimbangkan saat implementasi, bukan bukti kemampuan akun.
- [Flow video help](https://support.google.com/flow/answer/16353334?hl=en): mendeskripsikan workflow UI. Tidak membuktikan dukungan automation, selector DOM atau API publik; semuanya perlu dibuktikan dengan akun pengguna.
- [Tauri capabilities](https://v2.tauri.app/security/capabilities/) dan [sidecar](https://v2.tauri.app/develop/sidecar/): pembatasan akses UI serta runtime pendamping.

Pemeriksaan `npm view @siwc/local version license --json` mengembalikan E404. Ini hanya bukti package tersebut tidak tersedia lewat registry yang diakses, **bukan** bukti OAuth resmi tidak bisa dibuat. Source devkit yang ditautkan cookbook perlu diperiksa sebelum memilih reuse atau implementasi langsung. Pekerjaan adapter belum selesai.

Batas berhenti: AGENTS.md/plan.md menuntut live ChatGPT dan Flow sebelum ekspansi studio; akun pengguna/desktop Windows dan persetujuan biaya batch belum tersedia di lingkungan ini. Tidak mengganti gate dengan mock.

## ADR-012 — adapter ChatGPT TASK-003 (12 Oktober 2026; implemented, live pending)

Gunakan protokol OAuth public client yang didokumentasikan SIWC langsung, dengan jose 6.2.12/MIT untuk validasi JWT. Tidak memakai package contoh yang tidak tersedia atau menyalin endpoint privat. Model berasal dari discovery. Kredensial akun disimpan terenkripsi DPAPI CurrentUser via Windows PowerShell bawaan (skrip tetap, data stdin); tidak mengubah execution policy. Native host memegang lock file Windows eksklusif. Database produksi belum ada. Percakapan in-memory dan snapshot polling dipilih untuk thin slice tanpa memperbesar protokol ke event multiplexer; Responses tetap diterima streaming. Live login/entitlement/inference wajib dibuktikan di Windows sebelum TASK-003 lulus.


## ADR-011 — Flow setup sebelum submit (13 Oktober 2026)

Gunakan playwright-core 1.64.0 (Apache-2.0) dengan channel Chrome/Edge pengguna dan persistent profile khusus aplikasi, tanpa mengunduh browser otomatis. Package runtime disalin utuh dan LICENSE/NOTICE disertakan. Google login dilakukan pengguna; tidak melewati penolakan login/captcha. Fase awal hanya launch dan read-only label candidates. Dukungan otomasi akun, biaya dan selector submit belum terbukti, sehingga tidak ada command generate pada kontrak.

Dokumentasi primer yang diperiksa: https://support.google.com/flow/answer/16353333?hl=en (desktop Chromium), https://support.google.com/flow/answer/16526234?hl=en (saldo di menu akun, biaya terbaru di pengaturan prompt, biaya per generation dan kemungkinan beberapa hasil), https://playwright.dev/docs/api/class-browsertype (persistent context/profile khusus), https://flow.google/ (origin Flow). Dokumentasi ini bukan bukti live automation. Harga tidak dihardcode dari tabel dokumentasi.


## ADR-012 — sandbox aktif dan penolakan login Flow (13 Oktober 2026)

Sandbox Chromium diaktifkan eksplisit. Default Playwright adalah false; tidak ada fallback menonaktifkan sandbox jika launch gagal. Google menolak percobaan login pengguna; ini BLOCKED, bukan hasil login sukses atau bukti pasti bahwa flag sandbox penyebabnya. Observer mengklasifikasikan path rejected pada origin Google Accounts tanpa membaca DOM/query. Popup penolakan didahulukan dari tab Flow lama. AGENTS.md mengharuskan menghentikan modul provider ketika login/izin tidak tersedia; tahap submit tidak dilanjutkan.

Sumber primer diperiksa: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context-option-chromium-sandbox dan https://support.google.com/accounts/answer/7675428. Dokumentasi tidak membuktikan akun pengguna menerima browser otomatis.


## Konfirmasi ADR-004 — pilihan A (Accepted, 13 Oktober 2026, 19:21 WIB)

Pengguna memilih A dari docs/FLOW-INTEGRATION-DECISION.md: pertahankan Flow otomatis dengan kredit akun Flow dan hasil otomatis ke canvas. Alternatif pendamping manual maupun API dengan billing terpisah tidak dipilih. Kebutuhan asli tidak berubah; hambatan akses tetap BLOCKED dan kondisi berhenti AGENTS.md berlaku. Tidak menafsirkan keputusan produk ini sebagai bukti izin/akses provider atau persetujuan generasi berbayar.


## ADR-013 — browser Flow native WebView2 (14 Oktober 2026)

Accepted untuk implementasi/evaluasi atas permintaan pengguna; kompatibilitas live NOT RUN. Pengguna melaporkan akun berhasil pada Chrome biasa dan Switchly WebView2. Gunakan profil khusus serta popup satu environment sebagai acuan; tidak menyalin cookie/token atau menyamarkan browser. Ganti jalur Playwright di Aluraya agar hanya satu pemilik browser aktif. Profil lama dipertahankan utuh; profil native baru tidak melakukan migrasi sesi. Sidecar ChatGPT tetap. WebView provider terpisah dari UI/capability native lokal. Target akhir tetap otomatis sampai canvas setelah biaya dan approval; mode Generate manual Switchly tidak diadopsi sebagai penerimaan Aluraya.
