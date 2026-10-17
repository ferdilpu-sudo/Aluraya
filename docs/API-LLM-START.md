# Copilot API — Chat Completions

Checkpoint API-002, 16 Oktober 2026. Implementasi pertama mendukung **Chat Completions teks** dengan base URL, endpoint dan model pilihan pengguna. Responses, Anthropic Messages, Gemini Content dan custom HTTP masih konfigurasi saja. Kompatibilitas vendor/model harus diuji; tidak ada fallback otomatis ke provider atau protokol lain.

## Penggunaan
1. Buka aplikasi **Windows**. Browser preview hanya editor/config; tidak mempunyai backend key/request.
2. Di **Koneksi API**, tambah profil LLM dengan protokol `chat-completions`. Isi base URL, endpoint konkret (misalnya prefix `/v1` hanya ditulis sekali), model ID dan auth. Pilih profil tersebut pada routing LLM. Gunakan `none` hanya jika endpoint Anda memang tanpa autentikasi. Header key alternatif diatur pada JSON profil.
3. Di **Copilot → Copilot API**, pilih `max_completion_tokens` atau `max_tokens` sesuai dokumentasi provider, lalu **Gunakan profil ini**. Pilihan parameter tidak berubah otomatis bila ditolak provider.
4. Masukkan key pada kolom password dan **Simpan key**. Key tidak ditampilkan ulang. Status key tersimpan bukan bukti akses model. Perubahan profil/URL/endpoint/auth mengharuskan key cocok dengan tujuan baru; model boleh berubah pada tujuan yang sama. Data key tidak masuk config JSON atau draf proyek.
5. Tulis pesan. **Masukkan naskah ke pesan** menyalin teks secara eksplisit; naskah panjang harus dipilih cuplikannya sendiri, tidak dipotong otomatis. Riwayat percakapan, gambar, dan metadata proyek tidak dikirim otomatis. Batas pesan 6.000 karakter, batas output yang diminta 1–4.096 token.
6. Isi tarif input/output per satu juta token dan biaya tambahan per request, lalu centang bahwa Anda telah memeriksanya. Tarif adalah pernyataan pengguna, bukan harga yang ditemukan aplikasi. Untuk endpoint lokal gratis, isi 0 secara eksplisit. Jika tarif belum diketahui, jangan kirim.
7. Klik **Tinjau request**. Periksa tujuan, model, isi, batas token dan tarif; centang persetujuan, lalu **Kirim satu request**. Review berlaku 2 menit dan hanya sekali pakai. Test koneksi adalah request nyata yang dapat dikenai biaya; tidak dijalankan otomatis saat membuka aplikasi/menyimpan key.
8. Respons lengkap/terpotong tampil sebagai teks beserta token usage jika dilaporkan provider. Chat biasa tidak mengubah canvas. Untuk usulan terstruktur gunakan **Siapkan usulan aset & shot**, lalu [review planner](PLANNER-START.md) sebelum menerapkan tambahan. `max_*tokens` adalah parameter untuk provider, bukan jaminan batas nominal tagihan. Harga cache/reasoning/tier dan biaya lain harus dipastikan pada layanan Anda.

## Error dan pemulihan
- 401/403: key atau izin ditolak. Periksa tujuan/model; tidak mengalihkan provider.
- 429: batas provider, tidak retry otomatis.
- Timeout/network/5xx atau penghentian menunggu: status mungkin ambigu, provider dapat tetap memproses dan mengenakan biaya. Periksa dashboard pemakaian sebelum membuat request baru.
- HTTP 200 tanpa format Chat Completions teks yang valid: tampil sebagai respons tidak valid, bukan sukses. Tool calls tidak dieksekusi.
- `finish_reason=length`: respons ditandai terpotong; tidak otomatis meminta lanjutan.
- Gagal simpan/baca key: tidak menganggap key baru tersimpan; periksa akses penyimpanan Windows.

Percakapan, respons, review dan status request hanya dalam sesi saat ini. Menutup aplikasi tidak membatalkan pekerjaan yang sudah diterima provider dan tidak memulihkan request chat setelah restart. Tidak ada resume/retry POST otomatis. Jurnal produksi media tetap milestone terpisah.

## Boundary implementasi
`src/contracts/llm.ts` dan `src-tauri/src/llm_contracts.rs` memvalidasi configure/key/prepare/submit/cancel/inspect. Perintah Tauri hanya tersedia di window lokal main. Sidecar selalu memvalidasi ulang input; key dilindungi DPAPI CurrentUser menggunakan helper Windows yang sudah dipakai akun ChatGPT. File per profil di root privat aplikasi `chatgpt/llm-keys`, di bawah lock native yang sama. Key diikat ke profil/base URL/endpoint/auth; perubahan tujuan tidak memakai ulang key diam-diam. Nama secretRef adalah metadata, bukan path disk.

HTTP hanya dari sidecar, POST tunggal nonstreaming. HTTPS wajib kecuali loopback eksplisit. Redirect ditolak, key tidak diteruskan ke origin redirect. Timeout 5–600 detik, respons JSON maksimal 1 MiB, teks maksimal 6.000 karakter. Snapshot tidak mengandung key atau raw error provider; echo key literal pada output disunting. Ini bukan jaminan deteksi seluruh bentuk kebocoran dari layanan yang tidak dipercaya. Jangan memasukkan key di prompt.

Quote/approval mengikat koneksi aktif, isi pesan, batas token dan tarif. Mengganti koneksi/key menghapus review. Saat request aktif, mutasi koneksi/key ditolak. Submit menghabiskan review sebelum network call. Tidak ada tool execution, browsing, attachment upload, media generation atau auto-apply proyek di adapter ini.

Sumber parameter primer: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create . Implementasi mendukung subset teks; protokol vendor yang mengklaim kompatibel tetap perlu diperiksa tersendiri.

## Bukti
[Laporan API-002](../evidence/LLM-ADAPTER-REPORT.md). Uji lokal memakai server fixture pada loopback dan key sintetis; bukan penggunaan akun atau provider live. GUI Windows dan key/provider milik pengguna belum diuji.
