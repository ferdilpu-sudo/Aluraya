# TASK-003 — adapter ChatGPT pribadi lokal

Tanggal: 12 Oktober 2026; verifikasi CI diperbarui 13 Oktober 2026. REQ-002 / TEST-002; M-001 tetap in progress.

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

**LIVE NOT RUN:** login akun pengguna, eligibility/izin penggunaan paket, model discovery nyata, chat streaming nyata, logout/restart akun aktual dan visual/keyboard QA Windows baru. Installer belum diverifikasi. Tidak menyatakan M-001 lulus.

## Batas dan tindak lanjut

Riwayat chat masih in-memory; batas konteks sementara didokumentasikan di panduan. Pengaturan kredit tambahan dikelola pengguna di ChatGPT; checkbox adalah konfirmasi pengguna, bukan observasi billing API. Flow belum diimplementasikan. Langkah berikut: ikuti [CHATGPT-START](../docs/CHATGPT-START.md), lalu laporkan hasil sign-in/model/respons tanpa rahasia. Jangan memperluas studio sebelum integrasi utama terbukti.
