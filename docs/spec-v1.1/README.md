# Aluraya — spesifikasi aplikasi Windows

Versi 1.1 • 11 Oktober 2026 • Bahasa Indonesia.
Nama disetujui pengguna: **Aluraya**; nama lengkap **Aluraya Studio**; tagline *Dari naskah menjadi adegan.* Nama repository: `aluraya`. Status: **spesifikasi; belum ada aplikasi, integrasi teruji, installer, atau benchmark**. Kebutuhan produk dikonfirmasi dalam percakapan; stack adalah rekomendasi teknis yang masih perlu dibuktikan.

Studio canvas pribadi yang mengubah ide/naskah menjadi aset, storyboard, dan klip per shot dengan dialog serta SFX. Copilot berada di aplikasi, memakai kuota langganan ChatGPT. Google Flow membuat gambar/video melalui browser pendamping. Hasil wajib kembali otomatis ke canvas.

## Perangkat sasaran
HP Pavilion x360 14-dy0xxx; Intel Core i7-1165G7; RAM 8 GB (7,77 GB usable); Windows 11 Enterprise LTSC 24H2 x64. GPU, ruang disk, dan memori bebas saat bekerja belum diketahui. Jangan menyimpulkan performa dari label i7 saja. Jangan menyimpan device ID/product ID dari screenshot.

## Stack rekomendasi
- Tauri 2 + Rust: shell Windows, siklus hidup proses, penyimpanan dan jembatan terkontrol.
- React + TypeScript + React Flow: canvas, editor naskah, panel copilot, preview.
- Node.js + TypeScript sebagai satu sidecar: koneksi ChatGPT dan adapter browser Flow berbasis Playwright, jika pembuktian kompatibilitas berhasil.
- SQLite: metadata lokal, persetujuan, antrean; file media terpisah.
- FFmpeg/ffprobe: thumbnail, metadata, dan last frame; bukan render episode penuh.
Pilihan versi patch, SQLite binding, bundler sidecar, dan installer ditetapkan di M-001 berdasarkan kompatibilitas Windows serta lisensi; lalu kunci lockfile. Lihat [arsitektur](./architecture.md) dan [keputusan](./decisions.md).

## Prasyarat dan setup
Untuk pengembangan: Git, Rust stable beserta Windows C++ build tools, Node.js versi LTS yang kompatibel dengan dependensi terpilih, WebView2 Runtime, dan browser yang lolos pembuktian Flow. Untuk pengguna akhir: installer harus membawa sidecar; tidak meminta pengguna memasang Node/Rust.

Login ChatGPT melalui otorisasi resmi di browser sistem, lalu chat di aplikasi. Login Google dilakukan sendiri dalam profil browser khusus aplikasi. Tidak meminta password dalam chat, tidak mengambil sesi profil browser pribadi.

Perintah berikut **Direncanakan — verifikasi setelah scaffolding**, bukan perintah yang telah dijalankan:
```sh
npm ci
npm run tauri dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run tauri build
```
Agent harus membuat scripts tersebut di scaffolding sebelum mengklaim tersedia. Tidak ada OPENAI_API_KEY wajib. Pengaturan lokal: `dataDirectory`, `browserExecutable`, `maxActiveFlowJobs` (default 1), `maxActiveFlowProfiles` (default 1), `downloadTimeoutSeconds`; rahasia dikelola terpisah dari konfigurasi.

## Peta dokumen
- [PRD](./prd.md): lingkup dan penerimaan.
- [Design](./design.md): interaksi canvas dan persetujuan.
- [Architecture](./architecture.md): komponen serta alur runtime.
- [Schema](./schema.md): kontrak data, state, dan command.
- [Decisions](./decisions.md): alasan dan keputusan terbuka.
- [Rules](./rules.md): standar implementasi.
- [Testing](./testing.md): pengujian berbasis risiko.
- [Plan](./plan.md): urutan pekerjaan dan status.
- [AGENTS](./AGENTS.md): instruksi untuk coding agent.

## Langkah pertama
Mulai M-001: buktikan chat melalui kuota ChatGPT dan satu generasi gambar/video Flow yang masuk otomatis ke kartu canvas. Jangan membangun seluruh studio sebelum ketergantungan ini terbukti. Jika gagal, laporkan bukti dan pilihan; jangan mengganti kebutuhan menjadi kerja manual di browser.

## Revisi 1.1 — contoh prompt produksi
Memasukkan empat kelas prompt dari contoh pengguna: Character Card, Scene Plate, Storyboard Board, dan Video Timeline. Compiler prompt, manifest referensi berurutan dan lint konflik menjadi requirement REQ-016. Penjelasan skill ada di rules.md; data di schema.md; UI review di design.md. Contoh adalah bahan analisis perilaku, bukan bukti source code/skill internal Plot Party atau hasil render teruji.
