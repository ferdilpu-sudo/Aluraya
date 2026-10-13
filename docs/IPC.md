# IPC diagnostik M-001

Host Rust menjalankan satu sidecar Node sesuai path tetap milik aplikasi; UI tidak dapat memilih executable/argumen. Host memakai command Tauri `inspect_runtime`, dibatasi capability window lokal `main`. Tidak tersedia shell, filesystem, fetch atau submit provider dari UI.

Transport stdin/stdout memakai JSON UTF-8 berakhiran LF, maksimal **65.536 byte payload** per frame. Input UTF-8 rusak, JSON/schema tidak valid, field tambahan, perintah tidak dikenal dan frame terlalu besar/truncated mengakhiri sidecar. Error tidak memantulkan teks request. Media tidak dikirim sebagai base64 melalui transport ini.

Request v1:

```json
{"schemaVersion":1,"requestId":"38d0587b-17b4-4abc-a6c2-c23aabdaae8d","type":"health.inspect","payload":{}}
```

Respons sukses: `{schemaVersion:1, requestId, ok:true, payload:Diagnostics}`. DTO berada di `src/contracts/diagnostics.ts`, `src/contracts/sidecar.ts`, dan `src-tauri/src/contracts.rs`. Host memverifikasi korelasi ID, schema, struktur dan daftar check; UI memvalidasi ulang timestamp, field, ukuran, dan status memakai Zod.

Hanya satu pemeriksaan berjalan; host menolak request serentak dengan `DIAGNOSTICS_BUSY`. Timeout delapan detik mematikan sidecar dan mengosongkan slot. Percobaan pemeriksaan berikutnya membuat proses baru; tidak ada retry otomatis di request yang gagal. Saat aplikasi ditutup normal, host mematikan dan menunggu child. Sidecar juga keluar ketika stdin ditutup. Kill keras/proses host crash harus diverifikasi di Windows.

Status `host` baru menjadi PASS setelah host menerima respons tervalidasi. PASS `sidecar` hanya membuktikan runtime dan protokol, bukan akses ChatGPT/Flow. Belum ada command generasi, token, akun, atau koneksi jaringan di sidecar ini.

Variabel `NODE_OPTIONS` dan `NODE_PATH` dihapus pada child agar tidak dapat menginjeksi modul. Tidak ada port HTTP kontrol sidecar. Vite dev server hanya bind loopback dan hanya dipakai selama development.

Kontrak ini khusus diagnostik instalasi, sehingga tidak memakai `projectId`/`expectedRevision`. Command proyek pada schema utama tetap rencana milestone berikutnya. Batas approval/recovery produksi belum dianggap teruji oleh tes transport.

## Perluasan TASK-003 — 12 Oktober 2026

Bagian diagnostik di atas adalah checkpoint awal. Host sekarang juga mengizinkan command `chat_action` hanya dari window lokal `main`, diteruskan sebagai `type: chat.action`. Payload memakai discriminator `action`: inspect, login (addAccount), cancel, logout, usage, models, confirm_plan, clear, accounts (page), select (accountId), send (model, text). Field tambahan dan command lain ditolak. DTO: `src/contracts/chat.ts` dan `src-tauri/src/chat_contracts.rs`.

OAuth/fetch berjalan asinkron di sidecar; command segera mengembalikan snapshot publik. UI membaca snapshot tiap 500 ms selama operasi aktif. Snapshot berisi akun ringkas, model, status izin dan teks respons terakhir, tanpa token, kode OAuth, URL otorisasi, subject atau client ID. Rust memvalidasi struktur, batas dan UUID sebelum diteruskan; React memvalidasi ulang dengan Zod. Mutex host dan antrean UI mencegah pencampuran respons. Hanya satu operasi provider berjalan; cancel tidak menjalankan ulang request.

Callback OAuth memakai listener sementara 127.0.0.1 dengan state, nonce dan PKCE baru. Listener hanya menerima callback yang terikat percobaan, lalu ditutup. Ini bukan port kontrol aplikasi. URL browser berasal dari allowlist internal, bukan URL dari React atau model. Token tetap di sidecar dan penyimpanan DPAPI lokal. Database produksi masih belum dibuat; host tetap pemilik database saat diterapkan.


### Diagnostik kegagalan ChatGPT — 13 Oktober 2026

Snapshot menambahkan `diagnostic` nullable: `stage` (http/stream/protocol), status HTTP aktual, `shape` (error/detail/other/non_json/empty/event), serta `code`, `param`, `requestId` nullable dengan format dan panjang terbatas. Hanya field mesin yang lolos validasi diteruskan. Pesan/detail mentah, body, prompt dan header autentikasi tidak disalin. Event gagal setelah HTTP 200 tetap melaporkan 200; klasifikasi kuota memakai kode event. Rincian hilang pada operasi baru atau clear dan tidak ditulis ke disk. Native host dan Zod menolak field tambahan/ukuran berlebih.

`diagnostic.contentType` opsional/nullable berisi media type tanpa parameter, maksimal 100 karakter dengan format ASCII yang divalidasi; nilai header mentah tidak diteruskan. Ini membedakan respons HTML/JSON dan header yang hilang ketika server mengembalikan HTTP 200.
