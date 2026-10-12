# Menjalankan fondasi Aluraya di Windows

Paket ini berisi source M-001/TASK-002. Ini belum installer dan belum bisa login ChatGPT atau menghasilkan media Flow.

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

Klik **Periksa sekarang**. Hasil yang diharapkan pada Windows: host dan sidecar terhubung; ChatGPT, Flow dan generasi **belum siap**. Itu status yang benar pada checkpoint ini. Jangan menilai provider sudah bekerja hanya dari PASS host.

Jika gagal, jalankan `npm.cmd run doctor` dan kirim error build atau output diagnostiknya. Doctor tidak membaca token, cookie, maupun profil pribadi. Deteksi browser/WebView2 hanya pemeriksaan prasyarat, bukan bukti login.

## Preview UI saja

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka `http://127.0.0.1:1420`. Preview browser sengaja melaporkan bahwa host desktop tidak tersedia. Kartu dapat dipilih, digeser dan di-zoom; layout belum disimpan setelah restart. Chat dan produksi tetap nonaktif.

## Verifikasi dan paket native

```powershell
npm.cmd run check
npm.cmd run desktop:prepare
cargo test --manifest-path src-tauri/Cargo.toml
npm.cmd run tauri build
```

Build native/installer **belum dijalankan dalam lingkungan pembuat paket ini**. `Cargo.lock` harus dibuat dan disertakan setelah resolusi native pertama berhasil; jangan menyebut dependensi Rust sudah terkunci sebelum itu. NSIS memerlukan akses internet untuk WebView2 bootstrapper. Bundle membawa runtime Node dan sidecar; pengguna akhir tidak semestinya perlu memasang Node/Rust setelah installer tervalidasi.

## Langkah pembuktian berikutnya

1. Buktikan startup desktop dan round-trip diagnostik.
2. Implementasikan OAuth resmi dengan penyimpanan token terlindungi OS; verifikasi izin plan usage, discovery model, dan satu respons. Login sendiri, jangan kirim token/password ke chat.
3. Implementasikan adapter Flow pada profil khusus; observasi capability dan biaya aktual.
4. Tampilkan batch satu gambar lengkap dengan model/ref/biaya untuk persetujuan, baru jalankan. Video menyusul dengan persetujuan sendiri.

Mengukur satu sampel process tree (ganti angka dengan PID Aluraya, bukan terminal):

```powershell
.\scripts\Measure-Aluraya.ps1 -RootProcessId 12345
```

Ini bukan pengukuran peak atau p95 dan belum membuktikan performa RAM 8 GB.
