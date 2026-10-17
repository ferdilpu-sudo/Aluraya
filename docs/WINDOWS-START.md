# Menjalankan fondasi Aluraya di Windows

Paket aktif ADR-016: canvas terpadu dengan Copilot kanan dan skema API yang dapat disesuaikan. Nexabot dihapus, Flow tidak diaktifkan kembali. Lihat [panduan frontend](FRONTEND-STUDIO.md) dan [laporan perubahan](../evidence/PROVIDER-RESET-REPORT.md).

## Prasyarat pengembangan

1. Windows x64 dan Git.
2. Node.js **24 LTS x64**, baik instalasi MSI maupun distribusi ZIP resmi. Tidak perlu menginstal ulang Node untuk memperbaiki error lisensi.
3. Rust stable dengan target MSVC, Visual Studio Build Tools dengan workload **Desktop development with C++** dan Windows SDK.
4. Microsoft Edge WebView2 Evergreen Runtime. Windows LTSC tidak diasumsikan sudah menyediakannya.

Link vendor: [Node](https://nodejs.org/en/download), [Rust](https://www.rust-lang.org/tools/install), [prasyarat Tauri](https://v2.tauri.app/start/prerequisites/), [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

## Resolusi lisensi Node

Persiapan sidecar mencari `LICENSE`, `LICENSE.txt`, `license.txt`, atau `LICENSE.md` di sebelah runtime. Jika tidak ada, skrip mengambil teks LICENSE dari repository resmi `nodejs/node` pada tag versi Node yang sedang berjalan, dengan timeout dan batas ukuran. Hasil disimpan per versi agar build berikutnya dapat memakai cache secara offline. Bundle tetap wajib menyertakan lisensi; pemeriksaan tidak dilewati.

Jika komputer offline dan tidak ada lisensi/cache, sediakan LICENSE lengkap untuk versi Node yang sama melalui environment variable `ALURAYA_NODE_LICENSE_FILE`:

```powershell
$env:ALURAYA_NODE_LICENSE_FILE = 'C:\path\ke\LICENSE'
npm.cmd run tauri dev
```

Variabel itu menunjuk file lisensi, bukan token atau credential. Metadata bundle mencatat versi, asal, serta SHA-256 teks lisensi. File cache berada dalam resources hasil build yang diabaikan git.

## Buka aplikasi

Ekstrak ZIP, buka PowerShell di folder `aluraya`, lalu:

```powershell
npm.cmd ci
npm.cmd run tauri dev
```

Alternatif setelah prasyarat tersedia:

```powershell
.\scripts\Start-Aluraya.ps1
```

Ikuti kebijakan eksekusi PowerShell perangkat; tidak perlu mengubahnya karena perintah npm di atas setara. Build awal Rust dapat mengunduh dependensi dan memerlukan waktu. Aplikasi tidak meminta `OPENAI_API_KEY`.

Panel **Koneksi API** sekarang menyimpan skema provider, bukan diagnostik koneksi. Pilih protokol dan model sesuai dokumentasi provider; Chat Completions teks tersedia melalui Copilot API. Protokol lain dan media belum memiliki executor. Diagnostik host/sidecar tetap diperiksa melalui test packaging. Jangan menilai provider siap dari PASS host.

Vite mengabaikan `src-tauri` agar tidak memantau DLL/EXE/PDB yang dikunci compiler atau aplikasi Windows. Tauri tetap memantau perubahan source Rust. Setelah menarik perbaikan konfigurasi ini, tutup aplikasi dan hentikan proses dev lama dengan Ctrl+C, lalu jalankan kembali `npm.cmd run tauri dev`.

Jika gagal, jalankan `npm.cmd run doctor` dan kirim error build atau output diagnostiknya. Doctor tidak membaca token, cookie, maupun profil pribadi. Deteksi browser/WebView2 hanya pemeriksaan prasyarat, bukan bukti login.

## Preview UI saja

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka `http://127.0.0.1:1420`. Preview browser sengaja melaporkan bahwa host desktop tidak tersedia. Kartu dapat dipilih, digeser dan di-zoom; layout disimpan bersama draf di IndexedDB pada origin yang sama. Login/chat hanya tersedia di aplikasi Windows; produksi tetap nonaktif.

## Verifikasi dan paket native

```powershell
npm.cmd run check
npm.cmd run desktop:prepare
cargo test --manifest-path src-tauri/Cargo.toml
npm.cmd run tauri build
```

Build planner NSIS dan pemeriksaan installer PASS pada commit aplikasi `2ab6cd9`, [run 38992510402](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38992510402). Rinciannya ada pada [laporan planner](../evidence/PLANNER-REPORT.md). Cargo.lock hasil build ikut artifact CI; file itu belum dipin di source repository. NSIS memakai WebView2 download bootstrapper jika runtime belum tersedia. Instalasi pada Windows LTSC tanpa WebView2 dan pengoperasian offline belum dibuktikan.

Unduh [installer planner — **aluraya-native-lock-and-executable**](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38992510402/artifacts/12085394958) (login GitHub mungkin diperlukan), lalu ekstrak ZIP dan jalankan `Aluraya Studio_0.1.0_x64-setup.exe`. Artifact berisi `*-setup.exe`, executable hasil build dan Cargo.lock. Gunakan installer, bukan hanya menyalin aluraya.exe yang memerlukan resource pendamping. Artifact **aluraya-installer-check** pada run yang sama berisi JSON dengan source commit, hash/ukuran installer dan hasil pemeriksaan. Installer lama sebelum reset provider masih memuat Nexabot; gunakan tautan planner ini.

Pemeriksaan CI memasang installer ke folder sementara dengan spasi, mencocokkan aplikasi/Node/sidecar/lisensi serta memastikan runtime Playwright lama tidak ikut paket, menjalankan round-trip diagnostik dari Node terpasang, lalu uninstall. Ini tidak membuktikan GUI, login, upgrade dari versi sebelumnya atau performa laptop pengguna. Skrip `check-windows-installer.mjs` hanya untuk runner Windows CI sementara; jangan menjalankannya pada instalasi pribadi. Tidak ada penandatanganan installer yang dikonfigurasi.

## Langkah pembuktian berikutnya

1. Tutup aplikasi dev lama, pasang installer di atas, lalu buka Aluraya Studio hasil instalasi.
2. Buka proyek, ubah naskah/posisi node, lalu periksa status simpan. Buka ulang untuk memeriksa draf. GUI paket terpasang belum tercakup pemeriksaan CI.
3. ChatGPT akun tetap opsi terpisah di Copilot. Tidak perlu mengulang login Flow yang sudah diblokir.
4. Untuk Chat Completions, ikuti [panduan LLM](API-LLM-START.md) dan [review usulan canvas](PLANNER-START.md). Request memakai key/model serta tarif Anda dan hanya dikirim setelah persetujuan. Media tetap belum aktif.

Mengukur satu sampel process tree (ganti angka dengan PID Aluraya, bukan terminal):

```powershell
.\scripts\Measure-Aluraya.ps1 -RootProcessId 12345
```

Ini bukan pengukuran peak atau p95 dan belum membuktikan performa RAM 8 GB.

## Koneksi ChatGPT

Ikuti [CHATGPT-START.md](./CHATGPT-START.md) untuk login, model dan pesan pertama. Jangan mengirim token atau URL callback ke chat dukungan.

Paket aktif tidak memuat Nexabot. Gunakan [skema API](API-PROVIDERS.md); input key Chat Completions ada di Copilot API, khusus Windows.
