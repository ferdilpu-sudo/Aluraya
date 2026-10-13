# Aluraya Studio

**Dari naskah menjadi adegan.** Fondasi Windows pribadi, source v0.1.0 berdasarkan spesifikasi v1.1. Checkpoint 13 Oktober 2026: **M-001 in progress, integrasi belum lulus**.

Sudah tersedia: canvas satu kartu, diagnostik host/sidecar dan adapter ChatGPT dengan login browser, penyimpanan kredensial Windows, model discovery serta panel chat streaming. Fondasi runtime Windows dan CI native sudah PASS. Respons ChatGPT nyata sudah PASS berdasarkan screenshot pengguna; lihat [panduan ChatGPT](./docs/CHATGPT-START.md).

**Koneksi Flow awal:** profil Chrome/Edge khusus dan pemeriksaan halaman read-only tersedia melalui tab Flow; lihat [panduan Flow](./docs/FLOW-START.md). Login dan label akun aktual belum diverifikasi.

**Belum tersedia:** generasi Flow otomatis, penyimpanan proyek, media import, approval produksi, scheduler, dan installer tervalidasi. Chat aktif setelah akun, izin paket, model dan konfirmasi penggunaan tersedia. Tidak ada hasil AI sintetis yang dilabeli sebagai hasil provider. Posisi kartu dan riwayat chat hanya bertahan pada sesi aplikasi.

## Jalankan

Preview UI (Node.js 24 LTS):

```sh
npm ci
npm run dev
```

Buka http://127.0.0.1:1420. Browser melaporkan host desktop tidak tersedia, sesuai keadaan sebenarnya.

Desktop Windows memerlukan Rust stable MSVC, C++ Build Tools, WebView2, dan Node 24 x64 dengan lisensi distribusinya:

```powershell
npm.cmd ci
npm.cmd run tauri dev
```

Petunjuk lengkap, perbaikan prasyarat dan build installer ada di [docs/WINDOWS-START.md](./docs/WINDOWS-START.md). Tidak diperlukan OPENAI_API_KEY. Belum ada config kredensial yang harus diisi.

## Pemeriksaan tersedia

```sh
npm run check
npm run doctor
npm run build
```

`check`: format, lint, tes, typecheck dan build UI/sidecar. `doctor`: pemeriksaan prasyarat lokal; exit 2 berarti ada blocker. `build` **tidak** membangun executable Windows. `npm run tauri build` menjalankan build native pada Windows. Sidecar terpaket bersama runtime Node; installer final tetap perlu dibuktikan.

## Struktur

| Path | Tanggung jawab |
|---|---|
| src/features/ | Canvas, copilot shell, diagnostik |
| src/application/ | Bridge typed antara UI dan host |
| src/contracts/ | DTO Zod untuk input/output |
| src-tauri/ | Host native, proses sidecar, capability lokal |
| sidecar/src/ | Diagnostik, adapter ChatGPT dan framing terbatas |
| scripts/ | Build, packaging, prasyarat, sampel RAM |
| tests/ | Batas protokol dan proses sidecar nyata |
| docs/ | Menjalankan Windows dan protokol IPC |
| evidence/ | Bukti pemeriksaan dan keterbatasan checkpoint |

Target perangkat: HP Pavilion x360 14-dy0xxx, i7-1165G7, RAM 8 GB, Windows 11 Enterprise LTSC 24H2 x64. Belum ada benchmark. Banyak akun tetap rencana produk; default produksi satu profil/job aktif. Studio penuh, SQLite, FFmpeg dan adapter provider menunggu milestone terkait.

## Kontrak proyek

[PRD](./prd.md) · [Plan](./plan.md) · [Architecture](./architecture.md) · [Schema](./schema.md) · [Design](./design.md) · [Rules](./rules.md) · [Testing](./testing.md) · [Decisions](./decisions.md) · [AGENTS](./AGENTS.md)

Baca [evidence/M001-REPORT.md](./evidence/M001-REPORT.md) sebelum melanjutkan. Sumber asli spesifikasi tetap dalam ZIP unggahan pengguna; paket ini deliverable source baru. Source dipelihara di repository GitHub pengguna. Tidak ada generasi Flow atau pengeluaran provider dari pekerjaan coding ini.
