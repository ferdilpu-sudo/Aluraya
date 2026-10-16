# Rencana implementasi — Aluraya

Acuan aktif 16 Oktober 2026: ADR-016, permintaan pengguna kembali ke plan awal. Produk adalah studio dari ide/naskah hingga klip per shot melalui canvas terpadu dan Copilot kanan. Nexabot dihapus; Flow tidak diaktifkan kembali. Provider API dapat dipilih sendiri. Skema bukan bukti koneksi atau izin menghabiskan kredit.

## Alur produk yang dipertahankan
1. Ide/naskah → Copilot mengusulkan cerita, karakter, lokasi, properti.
2. Pengguna meninjau aset → storyboard per adegan, shot, dialog/SFX, kamera dan kontinuitas.
3. Pengguna menyetujui snapshot input, provider/model, batas biaya dan percobaan.
4. Adapter media menjalankan produksi; hasil otomatis masuk pada shot dan versinya di canvas yang sama.
5. Pengguna menerima/revisi versi, lalu mengekspor klip untuk editing di luar Aluraya.

Editor manual membantu penyuntingan; bukan pengganti planner atau otomatisasi produksi. Musik/subtitle/full timeline editor tetap di luar scope.

## Urutan kerja aktif
| Task | Status | Hasil / gate |
|---|---|---|
| RESET-001 · Pulihkan frontend awal | Implemented, verifikasi pada laporan | Canvas aset/storyboard/slot hasil, Copilot kanan; draf lama tetap kompatibel. Scene grouping dan versi hasil belum lengkap. REQ-001/003/004 |
| RESET-002 · Hapus Nexabot | Implemented | UI, sidecar, IPC native, capability dan akses media khusus dihapus. Tidak menghapus file pengguna di mesin lain. Flow tetap nonaktif. |
| API-001 · Skema provider | Implemented | Config v1, peran LLM/gambar/video, endpoint/model/auth reference/mapping/polling, import/export nonrahasia. Eksekusi teks melalui API-002; media belum aktif. REQ-002/007 |
| API-002 · Satu adapter LLM | Implemented partial, live pending | Chat Completions teks, key DPAPI terikat tujuan, review tarif satu request, timeout/error/cancel tanpa retry. [Panduan](docs/API-LLM-START.md). Proposal terstruktur dan protokol lain belum aktif. |
| PLAN-001 · Proposal dan approval | Next | Copilot membuat usulan aset/scene/shot; review diff; apply hanya setelah approval. Snapshot versi naskah/referensi/skill/model. Compiler 4 jenis prompt dan lint REQ-016. |
| MEDIA-001 · Adapter gambar/video | Pending | Capability/biaya terverifikasi; upload ref, submit sekali, poll, download aman; output terikat proyek/shot/revisi. Bukti satu gambar dan satu video nyata setelah approval biaya konkret. |
| STORE-001 · Persistence produksi | Pending | SQLite native, migrasi draf dengan backup, jurnal submit sebelum POST, recovery uncertain tanpa resubmit otomatis. REQ-010/015 |
| QUEUE-001 · Antrean dan akun | Pending | Banyak profil, pool-aware eligibility, default satu job; pergantian hanya dalam scope approval. REQ-008/014 |
| REVIEW-001 · Versi dan ekspor | Pending | Accepted output, dependensi last frame, invalidation, QA dialog/SFX dan ekspor klip. REQ-009/011/013 |
| RELEASE-001 · Penerimaan Windows | Pending | GUI/keyboard/upgrade, native backup/restore, pengukuran RAM laptop 8 GB dan seluruh AC. |

## Milestone awal tetap target
M-001 integrasi LLM dan media belum lulus. M-002 canvas/draf frontend PARTIAL; SQLite produksi belum ada. M-003 planner/approval/kompiler belum terintegrasi. M-004 scheduler, M-005 kontinuitas/review/ekspor dan M-006 penerimaan akhir belum selesai. Build installer tidak sama dengan lulus integrasi atau GUI.

## Kontrak API
Baca [API-PROVIDERS](docs/API-PROVIDERS.md), [contoh config](examples/providers.example.json) dan `src/contracts/providers.ts`. LLM tidak otomatis mampu membuat gambar/video. Nilai biaya dan capability pada config hanya deklarasi sampai diverifikasi; unknown cost menahan eksekusi. Key tidak masuk renderer config, draf, backup atau log. Chat Completions teks dapat dikirim setelah review eksplisit dan tarif dikonfirmasi pengguna; produksi media tetap belum aktif.

## Bukti
[Laporan perubahan](evidence/PROVIDER-RESET-REPORT.md) mencatat PASS/FAIL/NOT RUN. Bukti Nexabot/Flow dan installer sebelumnya adalah riwayat, bukan hasil build terbaru. Jangan mengulang login Flow yang telah diblokir. Langkah terkecil berikut: proposal terstruktur dari LLM → review perubahan → apply ke canvas dengan validasi versi sumber. Bukti adapter ada di [LLM-ADAPTER-REPORT](evidence/LLM-ADAPTER-REPORT.md).
