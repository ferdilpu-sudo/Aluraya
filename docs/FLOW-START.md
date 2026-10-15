> Riwayat: sejak 15 Oktober 2026 pengguna memilih API Nexabot setelah WebView2 diblokir. Gunakan [NEXABOT-START.md](NEXABOT-START.md); instruksi login Flow di dokumen ini tidak lagi berlaku.

# Flow melalui WebView2 Aluraya

Checkpoint 14 Oktober 2026: browser Flow sekarang memakai WebView2 native dalam jendela milik Aluraya, mengacu pada pengelolaan profil dan popup Switchly. Login Flow melalui Chrome biasa dan Switchly dilaporkan berhasil oleh pengguna; kompatibilitas WebView2 Aluraya tetap **NOT RUN** sampai diuji di Windows pengguna. Ini belum membuktikan integrasi generasi otomatis.

## Pemeriksaan akses pertama

1. Gunakan [installer WebView2 ed59d09 yang sudah lulus CI](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38505405511/artifacts/11867078618), atau pull source terbaru lalu jalankan `npm.cmd ci` dan `npm.cmd run tauri dev`. Installer a8f9e2e lama masih memakai Playwright.
2. Buka tab **Flow → Tambah profil Flow → Buka**. Label profil harus **WebView2**. Aplikasi membuka jendela Flow miliknya sendiri; belum berupa panel yang didock di canvas.
3. Login sendiri pada halaman Google yang tampil. Aluraya tidak mengisi login, membaca DOM login, menyalin cookie atau mengganti User-Agent. Popup memakai environment WebView2 yang sama dengan pembukanya.
4. Buka proyek Flow. Periksa apakah editor benar-benar terlihat. **Belum perlu Generate.** Kirim hasil akses atau pesan penolakan, tanpa email, token, URL callback atau data akun sensitif.
5. Tutup browser melalui tombol **Tutup browser Flow**. Tutup semua popup sebelum membuka profil lain. Menutup jendela utama Aluraya mengakhiri aplikasinya beserta browser miliknya.

Status panel hanya klasifikasi alamat (Flow/login/penolakan/halaman lain), bukan verifikasi login, saldo atau kemampuan akun. Penolakan pada popup diprioritaskan agar tab Flow tidak menutupi kegagalan login. Tidak ada status generationReady=true.

## Data dan batas

Profil baru berada dalam direktori data lokal aplikasi `flow-webview2/<UUID>`. Profil Chrome/Edge lama pada direktori `flow` tidak dimigrasikan, disalin atau dihapus. Jangan memasukkan folder profil ke git/backup proyek. Registry baru memakai lock eksklusif Windows dan penulisan atomik; data rusak menghasilkan error tanpa overwrite.

Satu profil aktif; jumlah profil tersimpan tidak dibatasi produk. Satu sesi dibatasi hingga lima jendela (utama + popup) untuk mencegah popup tak terbatas. Hanya tujuan HTTPS Google yang didaftarkan di policy diizinkan untuk navigasi tingkat atas. Navigasi lokal/custom-scheme dan origin tiruan ditolak. Bila ada domain login sah yang belum didukung, laporkan nama domain untuk diperiksa.

Halaman provider tidak memperoleh capability IPC aplikasi. Flow tidak lagi dijalankan sidecar dan tidak ada fallback Playwright. Unduhan diblokir pada tahap pemeriksaan ini; pipeline media otomatis akan dikembangkan setelah akses, capability, biaya dan approval konkret terbukti. Tidak membuka DevTools atau melemahkan sandbox/browser security defaults.

## Langkah sesudah akses terbukti

Buktikan capability/model dan biaya akun, bangun approval satu gambar, baru implementasikan submit/pantau/impor dengan korelasi hasil. Submit ambigu harus berhenti untuk rekonsiliasi, bukan mengirim ulang otomatis. Video menyusul. Pilihan pengguna tetap Flow otomatis dengan kredit Flow; mode produksi manual Switchly bukan target akhir Aluraya.
