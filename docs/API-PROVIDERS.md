# API yang dapat disesuaikan

Status API-002, 16 Oktober 2026: **Chat Completions teks sudah memiliki executor desktop**, sedangkan protokol lain dan media tetap kontrak konfigurasi/UI. Baca [panduan Copilot API](API-LLM-START.md). Nexabot dihapus. Alur produk tetap Copilot → tinjau aset/shot → approval → produksi → review hasil di canvas.

Buka **Koneksi API**, tambah profil untuk peran yang diperlukan, isi nama/base URL/endpoint/model, lalu Simpan profil. Pilih profil pada dropdown peran. Auth, biaya, capability dan mapping tersedia dalam JSON profil. Untuk memindahkan konfigurasi gunakan Tampilkan JSON / Impor JSON. Contoh lengkap: [providers.example.json](../examples/providers.example.json). Ganti placeholder berdasarkan dokumentasi provider; contoh memakai domain example.com, bukan layanan siap dipanggil.

## Peran
| Peran | Tugas | Hasil normalisasi yang dituju |
|---|---|---|
| llm | Percakapan, analisis naskah, usulan aset dan shot | Teks dan proposal terstruktur untuk ditinjau |
| image | Karakter, lokasi, prop, storyboard/start frame | Gambar lokal terikat revisi aset/shot |
| video | Klip per shot sesuai referensi dan dialog/SFX | Job terpantau dan video lokal terikat versi shot |

Satu vendor dapat dipakai untuk beberapa peran dengan profil berbeda. Model LLM tidak otomatis mempunyai kemampuan image/video. Routing hanya memilih profil, tidak memverifikasi kemampuan atau memberi approval produksi.

## Kontrak config v1
Sumber validasi: `src/contracts/providers.ts`. Seluruh object menolak field asing.

| Field profil | Arti |
|---|---|
| id, name, role | UUID stabil, label, llm/image/video |
| protocol | chat-completions / responses / anthropic-messages / gemini-content / custom-http |
| baseUrl | Origin/prefix HTTPS; HTTP hanya localhost, 127.0.0.1 atau ::1. Tanpa credentials/query/fragment |
| endpoint | Path relatif, misalnya /v1/chat/completions. Placeholder hanya {model}, {jobId}; tanpa query/traversal |
| model | ID dari provider, tidak hardcode model akun ChatGPT |
| auth | none, bearer + secretRef, atau header + headerName + secretRef |
| apiVersion | String versi API jika adapter memerlukannya; bukan header arbitrer |
| timeoutSeconds | Batas satu request, 5–600 detik |
| customMapping | null untuk protokol khusus; mapping eksplisit untuk custom-http |
| declaredCapabilities | referenceImages/referenceVideo/streaming/structuredOutput, hanya deklarasi pengguna |
| cost | unit unknown/request/second/million-tokens, currency, amount; unknown wajib amount:null |

`routing` memetakan llm/image/video ke UUID profil dengan role yang sama atau null. Profile ID tidak boleh duplikat. `schemaVersion` wajib 1. Tidak ada limit jumlah profil buatan produk. Impor UI dibatasi 128 KB per dokumen untuk ukuran input, bukan limit akun.

Konfigurasi nonrahasia disimpan di localStorage `aluraya-provider-config-v1`, terpisah dari draf proyek IndexedDB. Browser preview dan aplikasi desktop mempunyai storage terpisah. **Jangan tempel key di field apa pun.** `secretRef` adalah nama slot seperti `providers/llm/main`, bukan isi key. Field apiKey/token tidak diterima. Validator tidak dapat mendeteksi key yang sengaja ditulis dalam label/model; pengguna tetap harus menjaga config bebas rahasia. Kolom key Chat Completions tersedia di Copilot API Windows, terpisah dari config JSON, memakai DPAPI.

## Protokol LLM dan adapter
Chat Completions pada tabel sudah diimplementasikan untuk teks nonstreaming; baris lainnya masih rancangan. Implementasi bukan bukti koneksi provider live.

| Protokol | Bentuk request/response yang harus diterjemahkan adapter |
|---|---|
| chat-completions | messages/model → choices/message; banyak provider mengklaim kompatibilitas, harus diuji per provider |
| responses | input/model → output items; berbeda dari Chat Completions |
| anthropic-messages | messages/model/max_tokens, x-api-key dan anthropic-version → content blocks |
| gemini-content | contents/parts pada path model, x-goog-api-key → candidates/parts |
| custom-http | Mapping deklaratif menurut dokumentasi provider; tidak mengeksekusi script |

Bukan janji “semua API langsung jalan”. Auth signature khusus, query-key, multipart, SSE vendor, upload terpisah, websocket, output base64/binary dan protokol lain memerlukan tambahan adapter. Jangan mengganti label protokol untuk menutupi format yang tidak didukung.

Sumber primer untuk adapter mendatang:
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://developers.openai.com/api/reference/resources/responses/methods/create
- https://platform.claude.com/docs/en/api/messages/create
- https://platform.claude.com/docs/en/api/overview
- https://ai.google.dev/api

## Mapping custom HTTP
Rancangan default: submit JSON POST ke baseUrl + endpoint; polling GET. Prefix path baseUrl dipertahankan; adapter harus menggabungkan path secara eksplisit, meng-encode nilai placeholder, lalu memvalidasi origin. Template tidak boleh mengganti origin. Method lain belum ada dalam schema.

`inputs` memetakan sumber kanonik (prompt/messages/model/ratio/resolution/duration/references) ke JSON Pointer tujuan, misalnya prompt → `/input/prompt`. Pointer menggunakan escaping RFC 6901 (`~0`, `~1`). Target duplikat ditolak. Nilai references nantinya berasal dari upload adapter, bukan akses file arbitrer. Konversi enum, field statis vendor dan upload bukan fitur otomatis schema ini.

Output sinkron: `output.text` untuk LLM, `output.mediaUrl` untuk media, field lain null. Contoh URL nested `/data/output/0/url`; sesuaikan dengan respons sebenarnya.

Output asinkron harus memasangkan `output.jobId` dengan `polling`:

```json
{
  "inputs": [{ "source": "prompt", "target": "/input/prompt" }],
  "output": { "text": null, "mediaUrl": null, "jobId": "/id" },
  "polling": {
    "endpoint": "/jobs/{jobId}",
    "statusPath": "/status",
    "pending": ["queued", "processing"],
    "done": ["done"],
    "failed": ["failed"],
    "mediaUrl": "/result/url",
    "intervalSeconds": 3,
    "timeoutSeconds": 600
  }
}
```

Nama path/status di atas contoh fiktif, bukan endpoint provider tertentu. Status pending/done/failed tidak boleh tumpang tindih. Timeout polling terpisah dari timeout satu request. Kegagalan download tidak boleh memicu generasi ulang.

## Skema integrasi backend berikutnya
1. Native menyimpan key terenkripsi dan hanya mengekspos slot/status ke UI. UI mengirim profileId, bukan key tersimpan. Host memvalidasi ulang config dari storage; data renderer bukan authority.
2. Adapter LLM menghasilkan `Proposal { projectId, sourceRevision, changes, warnings }`. Pengguna meninjau perubahan sebelum apply; perubahan konteks membuat proposal/approval usang. LLM tidak berhak menyetujui dirinya sendiri.
3. Adapter media menyediakan `inspectCapabilities`, `quote`, `submit`, `poll`, `download`. Setiap submit terikat project/shot/revision/input hash/provider/model/cost approval. Schema cost sekarang hanya catatan; harga token input/output, usage dan price revision perlu kontrak quote terpisah.
4. Persist intent sebelum POST. Timeout ambigu → uncertain/reconcile, tidak auto-retry POST. ID job dipersist sebelum monitoring; terminal provider belum berarti media lokal siap.
5. Download ke staging dengan limit ukuran, MIME/signature, hash dan rename atomik. Tidak meneruskan key ke redirect lintas origin. Origin CDN harus disetujui adapter tanpa kredensial provider. Tolak file/internal network URL tidak sesuai profil; loopback hanya eksplisit untuk LLM lokal.
6. Simpan `Output { projectId, shotId, revisionId, providerProfileId, providerJobId, mediaId, state }`; hasil tampil pada slot shot. Human review memilih versi diterima. Tidak ada mock output yang diberi label sukses.

Implementasi API-002: secure key Chat Completions, executor teks, review tarif yang dikonfirmasi pengguna, approval sekali pakai, respons/error/cancel. Belum diimplementasikan: executor protokol lain, proposal planner, quote otomatis dari provider, upload/poll/download media, jurnal produksi dan binding hasil. Menyimpan config/key tidak mengirim request. Tidak ada pengeluaran live dari coding agent.
