# Nexabot thin slice — 15 Oktober 2026

REQ-004/006/007/010, TASK-004/005. Provider diganti atas keputusan eksplisit pengguna setelah laporan WebView2 diblokir. Screenshot penolakan tidak tersedia untuk dibaca; laporan pengguna dicatat tanpa mengklaim inspeksi gambar.

Implementasi: key DPAPI, endpoint reseller yang didokumentasikan pengguna, saldo, approval snapshot sekali pakai, img/t2v, SQLite journal sebelumPOST, uncertain tanparesubmit, resume knownID, media stream/MIME/signature/hash/rename, scoped asset preview, UI koneksi/form/riwayat. Tidak ada API key nyata atau request berbayar dalam pengujian.

Pemeriksaan lokal awal npm run check PASS75tests +2Windows-only skipped; setelah penambahan runtime smoke, lint menemukan import timer yang hilang dan diperbaiki. Pemeriksaan akhir npm run check PASS: 75 tes, 2 DPAPI Windows-only skipped; format/lint/typecheck/UI+sidecar build PASS. Windows CI masih pending pada commit implementasi.

Tes risiko: double-submit, biaya berubah, approval usang, timeout-submit+restart, durable submitting→uncertain, key fingerprint, retry download tanpaPOST, redirect key leakage, status ID mismatch, response202rusak, mediaHTML, input asing, error redaction. WindowsDPAPI test disediakan. Native DTO tests menolak path traversal/secretfield/parameter privileged. Installed smoke menambah inisialisasiSQLite Nexabot tanpa key/network.

NOT RUN: live Nexabot credit/generate/refund/download aktual; GUIWindows dan asset preview aktual; validitas decode/kualitasAI; RAM; reference modes; actual redirecthost. M-001 belumPASS. Biaya aktual dicatat bila provider mengirim credit_cost; API tidak mempunyai batas charge atomik. Riwayat lokal tidak dianggap bukti refund.
