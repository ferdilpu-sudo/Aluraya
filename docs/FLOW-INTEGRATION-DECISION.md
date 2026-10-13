# Pilihan integrasi setelah login Flow ditolak

13 Oktober 2026. TASK-004 / REQ-007 dan REQ-008. Status: A DIPILIH pengguna pada 13 Oktober 2026, 19:21 WIB. Kebutuhan asli tetap berlaku; M-001 belum lulus.

## Temuan yang dapat digunakan

- Dua screenshot pengguna membuktikan penolakan Google pada browser Aluraya. Sandbox sudah diaktifkan; screenshot kedua tidak menampilkan peringatannya, tetapi login tetap ditolak. Google mendokumentasikan browser yang dikendalikan automation sebagai salah satu kategori yang dapat ditolak. Penyebab internal untuk akun ini tidak diketahui.
- Dokumentasi resmi Flow Agent dan Tools menjelaskan generasi memakai kredit Flow dan penyimpanan hasil ke proyek di Flow. Dokumen yang diperiksa tidak menyediakan kontrak API publik untuk mengendalikan fitur tersebut dari Aluraya atau mengirim hasil otomatis ke canvas lokal. Ini batas bukti pencarian, bukan klaim bahwa API Flow mustahil tersedia.
- Gemini API mendokumentasikan generasi video dan billing tersendiri. Veo 3.1 tercantum pada paid tier, bukan free tier. Tidak ada bukti dalam dokumen yang diperiksa bahwa saldo Flow dapat dipakai sebagai saldo API.
- Membuka Flow secara manual di browser biasa dapat memisahkan masalah akses akun dari akses browser otomatis. Hasil langkah tersebut tidak membuktikan izin automation; browser itu tidak akan kemudian diambil alih atau sesinya disalin.

## Pilihan konkret

| Pilihan | Alur yang akan dibangun | Perubahan kebutuhan | Gate berikutnya |
|---|---|---|---|
| A — Pertahankan spesifikasi asli | ChatGPT di Aluraya; Flow otomatis memakai akun/kredit Flow dan hasil otomatis ke canvas | Tidak ada | TASK-004 tetap BLOCKED sampai akses integrasi yang didukung dan bekerja terbukti. Tidak mengulang profil/login yang ditolak. |
| B — Mode pendamping Flow | Aluraya menyiapkan prompt/referensi; pengguna menjalankan generasi di Flow dan mengunduh hasil; hasil diimpor/dipetakan ke shot di Aluraya | REQ-007/AC-007 dan gate M-001 harus direvisi eksplisit. Pengiriman serta pengambilan media tidak otomatis. | Setelah persetujuan perubahan scope: satu shot dengan prompt dan referensi, ekspor paket kerja, impor media dari file yang dipilih pengguna, preview. Fitur ini belum diimplementasikan. |
| C — Adapter API resmi | Aluraya memakai API generasi Google untuk submit, memantau dan mengambil hasil | Provider/billing produksi berubah; kredit Flow tidak diasumsikan berlaku. ChatGPT tetap memakai paket pengguna. | Setelah pilihan scope: adapter dengan approval biaya dan pengujian tanpa pengeluaran; live generation hanya setelah model, jumlah output dan batas biaya konkret disetujui. |

B menjaga pemakaian Flow tetapi mengurangi otomatisasi. C mempertahankan arah otomatisasi namun memperkenalkan billing API. A mempertahankan kedua syarat awal tetapi belum memiliki jalur integrasi yang terbukti. Pengguna memilih A. B dan C disimpan sebagai alternatif yang tidak dipilih; tidak diimplementasikan.

## Keputusan A dan syarat melanjutkan

Kebutuhan asli REQ-007/AC-007 dipertahankan: generasi Flow memakai akun/kredit Flow, dengan pengiriman dan pengambilan hasil otomatis sampai canvas Aluraya. ChatGPT tetap memakai paket pengguna. Pilihan A tidak membuktikan akses provider atau meluluskan M-001.

TASK-004 tetap BLOCKED sesuai AGENTS.md. Modul dapat dilanjutkan setelah ada bukti jalur akses integrasi yang didukung dan bekerja. Login biasa saja belum membuktikan otomatisasi. Selanjutnya capability/biaya akun harus diverifikasi, lalu satu batch konkret disetujui sebelum submit. Tidak ada pembelian, generasi, penggantian provider, atau perubahan kriteria penerimaan dari keputusan ini.

## Rincian alternatif yang tidak dipilih

Untuk B, slice pertama cukup satu shot, prompt siap salin, manifest referensi, pemilihan media lokal dan preview. Riwayat biaya ditandai dilaporkan pengguna, bukan saldo terverifikasi. Tidak melabeli proses manual sebagai TEST-007 lulus menurut kriteria lama.

Untuk C, slice pertama adalah adapter terpisah dan perhitungan proposal biaya dari konfigurasi model yang diverifikasi, penyimpanan credential lokal yang aman, approval snapshot, satu job dan pengambilan hasil. Tidak memasang layanan cloud tambahan, mengaktifkan billing atau membeli kredit atas nama pengguna. Jumlah/model/biaya live belum ditentukan.

Flow Agent/Tools dapat membantu pekerjaan di dalam Flow untuk pilihan B, bila tersedia pada akun pengguna. Ketersediaan akun dan kompatibilitasnya dengan kebutuhan naskah/referensi belum diuji. Fitur tersebut tidak dianggap sebagai bridge Aluraya yang sudah bekerja.

## Sumber primer

Diperiksa 13 Oktober 2026:
- https://support.google.com/accounts/answer/7675428?hl=en
- https://support.google.com/flow/answer/17093911?hl=en
- https://support.google.com/flow/answer/17104535?hl=en
- https://support.google.com/flow/answer/16526234?hl=en
- https://ai.google.dev/gemini-api/docs/video
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/pricing

Riset dokumentasi selesai; login baru, generasi, pengeluaran dan implementasi jalur pengganti NOT RUN. Tidak ada klaim harga tetap atau entitlement akun. CI kode 0f163ae telah lulus; pembaruan ini hanya keputusan/dokumentasi dan tidak memerlukan pengulangan tes runtime.
