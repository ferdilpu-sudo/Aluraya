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
