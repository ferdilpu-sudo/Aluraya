# TASK-003 — adapter ChatGPT pribadi lokal

Tanggal: 12 Oktober 2026; verifikasi CI diperbarui 13 Oktober 2026. REQ-002 / TEST-002; M-001 tetap in progress.

## Status terbaru — LIVE PASS pada thin slice

Screenshot `image(3).png` dari pengguna, 13 Oktober 2026 pukul 09:18 WIB, menampilkan GPT-6.1-Sol, input `tes`, jawaban “Halo! Saya siap membantu mengembangkan cerita di Aluraya Studio. Mau mulai dari ide, karakter, atau alur?” dan label **Selesai**, serta Using ChatGPT plan. Dengan implementasi saat ini, Selesai hanya ditetapkan setelah response.completed. Satu respons nyata dalam panel Copilot **PASS berdasarkan bukti pengguna**. Snapshot statis tidak membuktikan kelancaran animasi token per token.

SHA-256 screenshot: `6a8545d40ab2938bd38b67346eede2e63a4b338db3160e22e77b04d741271fb9`. Gambar tidak dimasukkan ke repo karena turut menampilkan bagian desktop lain. Kandidat source terakhir yang dibagikan: `97756415b949524b91c574f531e28f99b66d9dab`; screenshot tidak menunjukkan commit/hash executable. Hasil ini menggantikan status gagal pada catatan historis di bawah. Tidak ada bukti Content-Type aktual dari respons sukses sehingga peran header Accept versus pemeriksaan isi tidak dapat dipisahkan.

CI [9775641](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38336116077): TypeScript checks dan persiapan sidecar Windows PASS; native tests/build masih berjalan saat pemeriksaan. Lokal sebelumnya: 61 tes PASS, 1 Windows-only dilewati, format/lint/typecheck/build PASS.

Logout/restart/multiakun live, observasi billing/kredit tambahan, keyboard QA penuh, installer dan Flow belum terbukti oleh screenshot ini. Tidak menyatakan M-001 selesai. Langkah berikut: TASK-004 profil Flow dan observasi capability/biaya, sebelum submit batch konkret yang disetujui.

## Bukti sebelum adapter

Screenshot pengguna 18:26:55 pada Windows/Node v24.19.0 menunjukkan host dan sidecar Terhubung. [CI b3ae671](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38241262298) PASS termasuk native tests/build. Ini membuktikan fondasi TASK-002, belum login provider.

## Perubahan

- OAuth dynamic registration/returning client, PKCE S256, state sekali pakai, nonce; verifikasi JWT memakai jose 6.2.12 (MIT), issuer/audience/expiry/signature.
- Kredensial DPAPI CurrentUser, file atomik, host ID stabil, registrasi per akun, lock eksklusif oleh host Windows. UI menerima snapshot publik saja.
- Model discovery dari akun dan Responses HTTP/SSE resmi menggunakan bearer OAuth, store=false, stream=true. Tidak memakai endpoint backend-api atau API key.
- Copilot dengan login browser, akun/model, konfirmasi pengaturan paket, streaming melalui snapshot, pembatalan, logout/revocation dan pemulihan manual. Kuota habis tidak memicu retry atau billing fallback.
- Refresh diserialkan; kredensial pengganti disimpan sebelum request baru. Identitas returning yang berbeda ditolak.

## Verifikasi

`npm run check` lokal **PASS**: format, lint, typecheck, build UI/sidecar dan 44 tes; 1 tes DPAPI dilewati pada Linux. Build memberi peringatan chunk frontend 505 kB; ini bukan benchmark runtime. Suite keamanan meliputi listener loopback nyata dengan callback fixture, state/client substitution, JWT signed fixtures dan signature/claims invalid, SSE UTF-8 terfragmentasi, stream terputus/kuota, request allowlist, scopes, konfirmasi penggunaan, model discovery, history, cancellation dan refresh. Tidak ada OAuth/kuota nyata yang dipakai tes.

[CI implementasi f29c4bf](https://github.com/ferdilpu-sudo/Aluraya/actions/runs/38245120339) **PASS**: 45 tes JavaScript termasuk round-trip DPAPI Windows nyata, 4 tes Rust, persiapan sidecar Windows, dan build release native. Artefak berhasil diunggah. Tes Rust mencakup DTO yang menolak credential/field tambahan. Hasil ini membuktikan pemeriksaan otomatis Windows, belum interaksi provider dengan akun pengguna.

Perbaikan lanjutan tombol Kirim menolak snapshot error/BUSY sebagai pesan baru agar request kedua tidak menduplikasi reply ID yang sedang aktif. Pemeriksaan format dan typecheck lokal PASS; hasil CI di atas merujuk commit implementasi sebelum perbaikan UI kecil ini.

**LIVE UPDATE 13 Oktober:** screenshot pengguna 08:59 menampilkan GPT-6.1-Sol, Using ChatGPT plan dan pesan `tes`; jawaban kosong disertai PROVIDER_ERROR. Discovery/izin terlihat pada UI, inference **FAILED**, akar penyebab belum diketahui. Logout/restart akun aktual dan visual/keyboard QA lengkap **NOT RUN**. Installer belum diverifikasi. Tidak menyatakan M-001 lulus.

## Batas dan tindak lanjut

Riwayat chat masih in-memory; batas konteks sementara didokumentasikan di panduan. Pengaturan kredit tambahan dikelola pengguna di ChatGPT; checkbox adalah konfirmasi pengguna, bukan observasi billing API. Flow belum diimplementasikan. Panduan penggunaan: [CHATGPT-START](../docs/CHATGPT-START.md). Respons pertama sudah lulus; lanjutkan pembuktian Flow. Jangan memperluas studio sebelum integrasi utama terbukti.


## Diagnostik respons pertama — 13 Oktober 2026

Patch menambahkan diagnostic terstruktur di adapter HTTP/SSE, kontrak IPC TypeScript/Rust, state sesi dan panel Rincian kegagalan. Field hanya status, tahap, bentuk body, kode/parameter terbatas dan Request ID tervalidasi. Body/pesan detail mentah tidak diekspor; data diagnostik hanya di memori. UI tidak lagi menyebut jawaban kosong sebagai respons parsial. Tidak ada retry otomatis atau perubahan jalur billing.

Regresi mencakup HTTP 400 terstruktur, admission detail 403, HTML 502, kegagalan SSE dengan HTTP 200, format stream salah, penolakan field/identifier tidak aman, serta propagasi/pembersihan rincian tanpa menghapus kredensial. `npm run check` lokal PASS: format, lint, typecheck, build UI/sidecar dan 50 tes; 1 DPAPI Windows dilewati di Linux. Bundle UI 506 kB memberi peringatan ukuran yang sama. Hasil fixture bukan bukti perbaikan kegagalan live. CI native patch ini perlu diperiksa terpisah.


## Respons HTTP 200 ditolak sebelum dibaca — 13 Oktober 2026

Laporan pengguna berikutnya: `protocol / HTTP 200 / other / PROVIDER_ERROR`, Request ID tidak tersedia, pesan `hai` tanpa jawaban. Pada commit 7e48776, kombinasi ini berasal dari guard awal `consumeStream`: body tidak tersedia atau Content-Type bukan text/event-stream. Tidak membuktikan isi sebenarnya adalah SSE; kode lama belum membaca body pada jalur itu.

Patch menambahkan Accept: text/event-stream dan pemeriksaan awal isi dengan batas ukuran. SSE valid diproses meskipun media type hilang/berbeda; JSON error dengan HTTP 200 dipetakan menurut kode, sedangkan HTML, body kosong dan JSON non-stream tidak dianggap sukses. Tetap membutuhkan response.completed, tanpa retry otomatis. Content-Type media type yang dibatasi format ditambahkan pada rincian.

`npm run check` PASS: format/lint/typecheck/build dan 61 tes, 1 DPAPI Windows dilewati pada Linux. Regresi meliputi header hilang/salah kapitalisasi/text/plain, prefix terfragmentasi, pembatalan reader, JSON error HTTP 200, HTML/kosong/JSON non-stream, stream terputus dan batas baca. CI native patch dan hasil live **NOT RUN** pada saat pencatatan. Tidak menyatakan masalah akun telah selesai.
