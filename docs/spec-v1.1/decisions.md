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
