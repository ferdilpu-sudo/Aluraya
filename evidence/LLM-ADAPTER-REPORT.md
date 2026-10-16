# API-002 — Copilot Chat Completions, 16 Oktober 2026

## Hasil
Adapter teks terhubung dari Copilot UI → typed Tauri command → sidecar. Konfigurasi provider/model dapat disesuaikan; secret DPAPI terikat profil/URL/endpoint/auth. Review dua menit mengikat satu request dan tarif yang dikonfirmasi pengguna. HTTP nonstreaming, bounded response, no redirects, no auto-retry/fallback. Koneksi/key berubah membatalkan review; request aktif menahan perubahan. Error ambigu/cancel menjelaskan kemungkinan biaya. Output teks tidak dieksekusi atau diterapkan ke canvas.

## Pemeriksaan
- PASS `npm run check`: format, lint, 90 tes JavaScript + 2 Windows-only SKIP (92 total, 17 files), typecheck, Vite build dan bundled sidecar build.
- PASS real HTTP loopback: body/model/token limit/auth benar; redirect tidak meneruskan key; hanya satu POST.
- PASS bundled sidecar: configure → prepare → submit → inspect respons → EOF clean exit, fixture lokal tanpa akun provider.
- PASS lifecycle: key/tarif wajib, approval expired/replay/key-change ditolak, cancel dan network ambiguity tidak auto-submit ulang, raw error/secret fields ditolak.
- PASS `git diff --check`.
- Native Rust, DPAPI dan installer Windows perubahan ini: menunggu CI. Run reset sebelumnya 38837743565 PASS, tetapi bukan bukti adapter baru.
- NOT RUN GUI Windows/browser visual, key/provider/model pengguna, billing nyata dan kualitas respons. Tidak ada provider live atau pengeluaran dijalankan oleh coding agent.
- Warning bundler 554.6 KB JS / 171 KB gzip; bukan benchmark RAM.

## Batas
Hanya Chat Completions satu pesan teks. TokenLimitField dipilih eksplisit. Tarif manual, bukan discovery harga/cap nominal. Riwayat/quote/request sesi saja, tidak direplay setelah restart. Model discovery, streaming, tool calls, proposal terstruktur/apply, media generation, journal produksi dan executor protokol lain belum aktif. REQ-002 thin slice PARTIAL; PLAN-001 menjadi langkah berikut. Panduan: docs/API-LLM-START.md.
