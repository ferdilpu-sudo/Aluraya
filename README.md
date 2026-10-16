# Aluraya Studio

**Dari naskah menjadi adegan.** Fondasi Windows pribadi, source v0.1.0 berdasarkan spesifikasi v1.1. Checkpoint 16 Oktober 2026: **M-001 in progress, integrasi belum lulus**.

Arah aktif 16 Oktober 2026: **canvas terpadu dengan Copilot kanan**, aset di atas, storyboard di tengah, slot hasil di bawah. Draf proyek, editor detail, referensi lokal, pan/zoom, pencarian shot dan backup JSON tetap tersedia. [Panduan frontend](docs/FRONTEND-STUDIO.md).

**Nexabot dihapus. Flow tidak diaktifkan kembali.** [Skema API netral provider](docs/API-PROVIDERS.md) dan [contoh config](examples/providers.example.json) tersedia untuk LLM, gambar dan video secara terpisah. Profil dapat diatur di Koneksi API: protokol, base URL, endpoint, model, auth reference, mapping/polling dan biaya deklaratif. Config bukan koneksi terverifikasi; tidak menyimpan API key atau menjalankan request generik.

ChatGPT akun tetap opsi terpisah (login/streaming pernah dibuktikan), tanpa fallback berbayar otomatis. **Belum tersedia:** executor API generik, planner proposal/approval backend, produksi batch, upload/poll/download media generik, database produksi native, pengaitan hasil/versi dan ekspor klip. M-001 belum lulus. Tidak ada generasi berbayar dijalankan.

## Jalankan

[Build Windows](https://github.com/ferdilpu-sudo/Aluraya/actions): pilih workflow commit terbaru yang berhasil → Artifacts → `aluraya-native-lock-and-executable`. Ekstrak ZIP dan jalankan installer. Installer frontend d31890d merupakan versi lama yang masih memuat Nexabot. Bukti perubahan ini ada di [laporan reset](evidence/PROVIDER-RESET-REPORT.md).

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

Petunjuk lengkap, perbaikan prasyarat dan build installer ada di [docs/WINDOWS-START.md](./docs/WINDOWS-START.md). Tidak perlu API key untuk menyunting draf atau konfigurasi. Penyimpanan key dan executor API generik menyusul.

## Pemeriksaan tersedia

```sh
npm run check
npm run doctor
npm run build
```

`check`: format, lint, tes, typecheck dan build UI/sidecar. `doctor`: pemeriksaan prasyarat lokal; exit 2 berarti ada blocker. `build` **tidak** membangun executable Windows. `npm run tauri build` menjalankan build native pada Windows. Sidecar terpaket bersama runtime Node. Build NSIS, instalasi, resource, diagnostik sidecar terpasang dan uninstall sudah PASS di CI; GUI pada laptop pengguna belum diuji dari installer. Lihat [bukti installer](./evidence/WINDOWS-INSTALLER-REPORT.md).

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
