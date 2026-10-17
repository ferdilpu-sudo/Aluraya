# Aluraya Studio — baseline rencana awal

**17 Oktober 2026: main dipulihkan ke baseline stabil `a8f9e2e` (13 Oktober), sesuai ZIP pengguna.** Arah produk kembali ke [spesifikasi asli v1.1](docs/spec-v1.1/README.md): studio Windows pribadi dari ide/naskah, aset, storyboard hingga klip per shot, dengan hasil otomatis pada canvas.

- Copilot di dalam aplikasi memakai paket ChatGPT; tidak ada fallback API berbayar.
- Gambar/video melalui akun dan kredit Google Flow pada browser pendamping khusus.
- Canvas: aset di atas, storyboard di tengah, hasil di bawah, Copilot di kanan.
- Persetujuan per tahap/input/biaya, default satu profil dan satu job aktif.
- Output klip per shot dengan dialog/SFX; musik, subtitle dan editing episode di luar aplikasi.

Source aplikasi, tests, scripts dan konfigurasi runtime kembali persis ke baseline. Cargo.lock dipulihkan dari ZIP. Nexabot, API LLM generik, WebView Flow tertanam dan planner draf sesudah baseline tidak ada di main. Versi tersebut disimpan hanya untuk pemulihan di branch [archive/2026-10-17-before-original-baseline](https://github.com/ferdilpu-sudo/Aluraya/tree/archive/2026-10-17-before-original-baseline), bukan acuan kelanjutan.

## Status sebenarnya
**M-001 belum lulus.** Baseline stabil berarti build/installer terverifikasi; bukan otomatisasi Flow selesai. Thin slice ChatGPT pernah menghasilkan jawaban nyata. Login Flow pada profil aplikasi masih terblokir; generasi, pengambilan hasil otomatis, produksi dan seluruh studio belum terbukti. Tidak membangun milestone lanjutan di atas blocker ini.

Langkah berikut: **TASK-004 — buktikan jalur akses Flow yang didukung**, lalu capability/biaya dan persetujuan satu gambar. Jika akses tetap terblokir, laporkan blocker; jangan mengganti kebutuhan atau membuat fallback diam-diam. Lihat [plan aktif](plan.md).

## Baseline dan menjalankan
ZIP pengguna cocok SHA-256 dengan [artifact a8f9e2e](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38399230862/artifacts/11815215304). Ekstrak dan jalankan `target/release/bundle/nsis/Aluraya Studio_0.1.0_x64-setup.exe`. Tidak perlu API key atau memasang Node/Rust untuk menggunakan installer.

Untuk source di folder checkout baru:

```powershell
git clone https://github.com/ferdilpu-sudo/Aluraya.git Aluraya-baseline
cd Aluraya-baseline
npm.cmd ci
npm.cmd run tauri dev
```

Development Windows memerlukan Node 24 x64, Rust/MSVC, C++ Build Tools dan WebView2. [Panduan Windows](docs/WINDOWS-START.md). Riwayat main dipulihkan: jangan merge kembali perubahan versi menyimpang melalui pull biasa dari checkout lama. Data dan file pengguna pada komputer tidak dihapus oleh pemulihan Git.

## Dokumen dan verifikasi
[PRD](prd.md) · [Plan](plan.md) · [Architecture](architecture.md) · [Schema](schema.md) · [Design](design.md) · [Rules](rules.md) · [Testing](testing.md) · [Decisions](decisions.md).

Sepuluh dokumen ZIP asli disimpan tanpa perubahan di `docs/spec-v1.1/`. Dokumen root memakai requirement yang sama dengan checkpoint faktual. [Laporan pemulihan](evidence/BASELINE-RESTORE-REPORT.md) mencatat hash ZIP, source, scope pembersihan dan PASS/NOT RUN. Manifest provenance: [BASELINE.json](BASELINE.json).

`npm run check` memeriksa format, lint, tes, typecheck dan build UI/sidecar. Build native: `npm run desktop:prepare`, `cargo test --locked --manifest-path src-tauri/Cargo.toml`, `npm run tauri build -- --bundles nsis`. Tidak ada provider live atau generasi berbayar yang dijalankan oleh pemulihan ini.
