> ARSIP: integrasi ini dihapus pada ADR-016 (16 Oktober 2026). Bukan panduan runtime aktif; lihat [plan terbaru](../plan.md).

# Kontrak reseller Nexabot

Sumber: dokumentasi API yang ditempel pengguna pada 15 Oktober 2026, 08:19 WIB. Origin `https://nexabot.id`. Dokumen login https://nexabot.id/api-docs tidak dapat dibaca tanpa sesi saat riset. Kontrak ini supersedes contoh landing page api.nexabot.id/api/v1/generate.

- Header `x-api-key: nxb_…` atau Bearer; adapter memakai header pertama.
- POST `/api/v1/api`: generate; HTTP202 `{ok:true, job_id, status:"queued", download_url, credit_cost:0.15, credit_balance, est_seconds}`.
- GET `/api/v1/api/credit`: gratis; `{ok:true,telegram_id,registered:true,credit,credit_cost}`.
- GET `/api/v1/jobs/:id`: `{ok:true,job:{id,status,mode,prompt,progress,error}}`; status queued/processing/done/failed.
- GET `/api/v1/jobs/:id/download`: autentikasi key sama; MP4 video, JPG image, WAV music/tts. Curl contoh mengikuti redirect; hostname redirect tidak didokumentasikan.

Biaya dokumentasi: 0,15 kredit per request, refund jika gagal; unlimited tidak berlaku. Aplikasi memakai biaya terbaru dari endpoint credit, tanpa mengubahnya ke rupiah karena tarif pembelian kredit akun tidak diketahui. Tidak mengklaim refund sebelum saldo/provider membuktikannya.

| Mode | Input/opsi menurut dokumentasi | Status implementasi |
|---|---|---|
| img | prompt; aspect 1=1:1,2=16:9,5=9:16 | Slice pertama |
| t2v | prompt; ratio1=16:9/2=9:16; resolution720/1080 | Slice pertama |
| sfv | prompt; media[0] image data URI; ratio/resolution | Belum |
| i2v | prompt; media1–3 image data URI; ratio/resolution | Belum |
| r2v | prompt; video media[0], image opsional menurut ringkasan; ratio/resolution | Belum; konfirmasi ketidakkonsistenan tabel yang menuliskan 1video+1image |
| extend | MP4 media[0]; prompt opsional; ratio; hasil selalu1080 | Belum |
| music | prompt | Di luar scope produksi awal |
| tts | prompt; voice default Achernar; daftar melalui GET/api/v1/modes | Di luar scope produksi awal |

Tidak ada parameter model atau durasi pada kontrak yang diberikan. Jangan menebak bahwa model tertentu, durasi tertentu, atau kualitas Flow terjamin. Angka estimasi t2v60s/img22s adalah waktu pemrosesan perkiraan, bukan durasi output.

Error HTTP:400 invalid body,401 key,402 saldo,403 ownership,404 job,429 limit. Walau teks mengklaim reseller tanpa rate limit, adapter tetap menangani429 tanpa retryPOST. Belum ada kontrak idempotency/reconcile tanpaID/cancel/maximum-cost; timeout/5xx/response ambigu tidak dapat diulang otomatis.
