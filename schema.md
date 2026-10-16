# Kontrak data — Aluraya

## Aturan umum
SQLite milik host, foreign keys aktif, migration versioned. UUID string untuk ID, timestamp UTC ISO-8601, revision integer positif, SHA-256 hex untuk snapshot dan media. Path media relatif terhadap folder proyek; token/cookie/browser profile tidak disimpan di tabel atau ekspor. Field nullable ditandai `?`; lainnya wajib. JSON harus melewati schema versioned sebelum disimpan.

## Entitas
| ID | Entitas dan field inti | Relasi / constraint |
|---|---|---|
| ENT-001 | Project(id, title:text, aspect:9:16/16:9, targetSeconds:int?, language:text, adaptation:preserve/adapt/expand, createdAt, updatedAt) | targetSeconds > 0 jika diisi |
| ENT-002 | ScriptRevision(id, projectId, revision:int, sourceText:text, productionText:text, sourceKind:idea/full/excerpt, contentHash, createdAt) | unique(projectId, revision); immutable |
| ENT-003 | Asset(id, projectId, kind:character/location/prop, name:text, acceptedRevisionId?) | accepted revision harus milik asset |
| ENT-004 | AssetRevision(id, assetId, revision:int, description:text, mediaId?, source:upload/provider, parentRevisionId?, contentHash) | immutable; referensi sumber eksplisit |
| ENT-005 | ShotRevision(id, projectId, stableShotId, revision:int, sceneOrder:int, shotOrder:int, scriptRevisionId, prompt:text, dialogue:JSON, sfx:JSON, camera:JSON, durationSeconds:int, aspect, references:JSON, contentHash) | durasi/model diverifikasi saat produksi |
| ENT-006 | Dependency(id, projectId, sourceRevisionId, targetShotRevisionId, kind:reference/last_frame/continuity) | graph produksi harus acyclic; tidak self-edge |
| ENT-007 | CanvasNode(id, projectId, entityType, entityId, x:real, y:real, width:real, height:real, groupId?) | referensi entity valid; ukuran > 0 |
| ENT-008 | CanvasEdge(id, projectId, sourceNodeId, targetNodeId, kind:reference/sequence/continuity) | tidak semua edge visual adalah dependensi job |
| ENT-009 | ProviderAccount(id, providerProfileId?, connectionMode:api/chatgpt, label:text, profileRef:text, state:ready/needs_login/disabled/rate_limited, creditPoolId?, capabilities:JSON, checkedAt?) | profileRef opaque; bukan token |
| ENT-010 | CreditObservation(id, accountId, poolId?, balance:decimal?, observedAt, source:provider_api, freshness:known/unknown/stale) | balance >= 0; null != 0 |
| ENT-011 | Approval(id, projectId, stage:script/assets/storyboard/generation, snapshotHash, accountPoolIds:JSON, maxCredits:decimal?, maxAttempts:int, approvedAt, revokedAt?) | maxAttempts >= 1; generation perlu batas kredit terverifikasi |
| ENT-012 | Job(id, projectId, inputRevisionId, approvalId, status, priority:int, createdAt, leaseOwner?, leaseUntil?) | satu dispatcher aktif per job |
| ENT-013 | Attempt(id, jobId, ordinal:int, accountId, modelId:text, snapshotHash, estimatedCredits:decimal, state, providerJobRef?, providerProjectRef?, submittedAt?, errorCode?) | unique(jobId, ordinal); immutable input snapshot |
| ENT-014 | CreditReservation(id, attemptId, poolKey:text, amount:decimal, state:held/reconciled/released/uncertain) | transaksi bersama pemilihan akun |
| ENT-015 | MediaFile(id, projectId, relativePath:text, sha256, mime:text, bytes:int, durationMs:int?, width:int?, height:int?, attemptId?, sourceMediaId?, extractionMs:int?) | unique(projectId, relativePath); bytes > 0 |
| ENT-016 | Conversation(id, projectId, messages:JSON, summary:text, updatedAt) | model context disusun dari state lokal |
| ENT-017 | Proposal(id, projectId, expectedRevision:int, operations:JSON, state:pending/applied/rejected, createdAt) | tidak dapat membawa approval pengguna palsu |
| ENT-018 | Event(id, projectId, sequence:int, type:text, entityId, payload:JSON, createdAt) | unique(projectId, sequence); payload tanpa secret |
| ENT-019 | ResultSelection(id, stableShotId, shotRevisionId, mediaId, status:review/accepted/rejected, notes:text) | accepted terikat ke input dan media tertentu |

## Field terstruktur
Dialogue: array `{speakerAssetId, text, delivery, startHintSeconds?}`; text asli dipertahankan dalam preserve mode. References: array `{assetRevisionId?, mediaId, role:identity/location/prop/start_frame/end_frame, order}`. Camera: `{framing, angle, movement, blocking}`. Capabilities: `{modelId, modes, aspects, durationsSeconds, maxReferences?, supportsAudio, outputCountOptions, observedAt}`. Batas ukuran/format dari provider tidak dikarang: unknown -> belum siap submit. Input teks UI diberi batas teknis terdokumentasi di scaffolding; naskah besar dibagi per scene, tidak dipotong diam-diam.

## State machine
Job: draft -> awaiting_approval -> queued -> running -> awaiting_review -> completed. Cabang: blocked, paused, failed, cancelled. Freshness diturunkan dari hash/revisi, bukan dicampur dengan status job.
Attempt: prepared -> submitting -> submitted -> generating -> downloading -> succeeded. Cabang: uncertain, failed, needs_login. Timeout dari submitting selalu uncertain kecuali bukti provider memastikan tidak terkirim. Cancel lokal tidak membuktikan cancel provider.
Media hanya ditampilkan ready setelah file tervalidasi dan metadata commit. accepted ditentukan pengguna, berbeda dari succeeded.

## Command dan event internal v1
Envelope command: `{schemaVersion:1, requestId, projectId, expectedRevision, type, payload}`. Host memvalidasi scope project dan revision; command duplikat dengan requestId sama mengembalikan hasil yang sama tanpa side effect kedua.
- `project.create`, `script.propose`, `proposal.apply`, `asset.import`, `shot.revise`.
- `approval.create`: hanya melalui interaksi UI pengguna; input snapshotHash, stage, maxCredits, maxAttempts, accountPoolIds.
- `generation.enqueue`: snapshotId dan approvalId; tidak menerima boolean approved dari model.
- `generation.pause`, `attempt.reconcile`, `result.accept`, `media.export`.
- `account.connect`: profil baru dipilih eksplisit; login ditangani provider.
Events: `job.updated`, `attempt.uncertain`, `media.ready`, `approval.stale`, `account.needs_login`. Event membawa sequence agar reconnect UI dapat mengejar event yang tertinggal.
Error: AUTH_REQUIRED, PLAN_LIMIT, INSUFFICIENT_CREDITS, CREDIT_UNKNOWN, CAPABILITY_UNKNOWN, APPROVAL_STALE, BUDGET_EXCEEDED, SUBMISSION_UNCERTAIN, PROVIDER_CHANGED, DISK_FULL, DOWNLOAD_FAILED, REVISION_CONFLICT.

Contoh proposal enqueue (belum berarti terkirim):
```json
{"schemaVersion":1,"requestId":"req-example","projectId":"project-example","expectedRevision":3,"type":"generation.enqueue","payload":{"snapshotId":"snapshot-example","approvalId":"approval-example"}}
```
ID contoh hanya ilustrasi kontrak; ID runtime harus UUID.

## Transaksi dan konsistensi
Approval snapshot mencakup input hash, model, mode, rasio, durasi, outputCount, referensi, cost cap dan retry cap. Reservasi dikurangi dari saldo observed untuk pemilihan berikutnya, tetapi bukan klaim tagihan final. Hasil gagal dapat tetap dikenai biaya; hanya rekonsiliasi provider yang boleh mengonfirmasi debit/refund. Job uncertain menahan reservasi.
Revisi aset/shot baru tidak menimpa versi lama. Deletion logis dahulu; garbage collection media hanya dengan pemeriksaan referensi dan konfirmasi. Backup konsisten menggunakan API backup SQLite; restore memverifikasi hash media. Tidak ada cloud sync pada MVP.

## Migrasi
M-001 skema minimum Project, Account, Job, Attempt, MediaFile; migrasi berikut menambah revisi, approval dan graph tanpa mengganti ID. Backup sebelum migrasi destruktif; uji restore dengan fixture. Versi DB lebih baru ditolak dengan pesan, tidak dipaksa downgrade. Fixture memakai akun/media sintetis, bukan sesi pengguna.

## Tambahan kontrak v1.1: prompt dan referensi
- ENT-020 `PromptDocument(id, projectId, kind:character_card/scene_plate/storyboard_board/video_timeline, revision:int, structuredContent:JSON, renderedText:text, templateVersion:text, compilerVersion:text, styleRevisionId:text, manifestId, validationState:needs_validation/blocked/warnings/valid, contentHash, createdAt)`. Versi immutable setelah dipakai approval; field per jenis diwajibkan lewat discriminated schema.
- ENT-021 `ReferenceManifest(id, projectId, revision:int, entries:JSON, contentHash)`. Entry: `{slot:int, role:identity/location/prop/previous_board/continuity_frame/storyboard_plan, entityRevisionId, mediaId, mediaHash, sourcePanelIndex?:int, usage:identity_only/layout_only/continuity/plan_only/start_frame/end_frame}`. Slot berurutan mulai 1 dan unik per invocation. usage harus cocok dengan role dan capability.
- ENT-022 `StyleRevision(id, projectId, revision:int, realismMode:text, palette:text, texture:text, taskLighting:JSON, defaultCameraPolicy:JSON, negativeTerms:JSON, contentHash)`.
- ENT-023 `PromptValidation(id, promptDocumentId, validatorVersion, issues:JSON, capabilitySnapshotHash, createdAt)`. Issue: `{code, severity:blocker/warning, fieldPath, explanation, suggestedFix?, acknowledgedAt?}`; blocker tidak dapat dibypass hanya dengan acknowledge.

Storyboard structuredContent: `{layout:{rows:3,columns:3,canvasAspect}, continuitySource?:{mediaId,panelIndex,observed:boolean}, panels:[{index,shotRevisionId,locationRevisionId,framing,cameraAxis,charactersVisible,action,initialState,finalState}], textPolicy:none}`. Dalam mode nine-panel, indeks persis 1..9, tidak duplikat. Panel adalah momen naratif, bukan varian gambar sama. Source observed=false merupakan rencana, bukan klaim last frame aktual. Generate yang membutuhkan hasil sebelumnya tetap menunggu media nyata yang diterima.

Video structuredContent: `{durationSeconds, beats:[{startSeconds,endSeconds,sourcePanels:int[],framing,cameraMovement,transitionIn:cut/continuous,charactersVisible:assetId[],action,dialogue:[{speakerAssetId,text,language,delivery}],ambient:string[],sfx:string[],startState,endState}], sceneCast:assetId[], music:false, burnedInText:false}`. Timeline menutup 0..durationSeconds, start < end; jumlah cast adegan terpisah dari visible cast per shot. Dialog disimpan verbatim. EstimatedSpeechSeconds berupa estimasi dengan metode dan confidence, bukan durasi audio terukur.
Character card: `{identityTraits,wardrobe,pose,framing,lighting,background,views}`. Multi-view opsional; dilarang mewariskan timeline/camera movement video ke gambar identitas tanpa tujuan jelas.
Scene plate: `{locationGeometry,landmarks,props,timeOfDay,lighting,palette,occupancy:empty,excludedHumanEvidence:[people,shadows,reflections],cameraView}`.
Approval snapshot generasi diperluas dengan promptDocumentId/hash dan manifest hash. Enqueue memerlukan validasi terbaru terhadap capability yang relevan. Validasi prompt tidak membuktikan hasil generator patuh; ResultSelection tetap human review.


## Kontrak scaffold diagnostik (M-001/TASK-002)

`health.inspect` adalah pemeriksaan instalasi tanpa project scope, token, atau side effect provider. `inspect_runtime` merupakan command Tauri lokal; response berisi runtime/platform/nodeVersion/checks. Detail, batas frame dan UUID ada di [docs/IPC.md](./docs/IPC.md); DTO TS ada di `src/contracts/`, mirror Rust di `src-tauri/src/contracts.rs`. Tidak mengubah kontrak produksi yang belum diimplementasikan di atas.


## DTO browser Flow v2 — TASK-004, 14 Oktober 2026

`flow_action` kini native-only: inspect/create/open(profileId UUID canonical)/observe/close/profiles(page 0..100000), semua field asing ditolak. create tidak menerima nama browser lagi. Snapshot schemaVersion=2, runtime=webview2, profiles berupa id UUID saja, profileCount/profilePage, activeProfileId nullable, browserOpen, observation nullable {checkedAtMs, page, origin}, generationReady=false, error kode terbatas. page hanya klasifikasi URL dan tidak berarti login sukses. origin tidak memuat path/query/fragment. Kontrak TS di src/contracts/flow.ts dan Rust di src-tauri/src/flow_contracts.rs. flow.action pada stdio sidecar tidak lagi didukung.


## Schema draf frontend v1
`StudioProject`: version=1, id UUID, name, updatedAt, ratio 16:9/9:16, targetSeconds, adaptation preserve/adapt/expand, script, assets, shots. Asset: id, name, kind character/location/prop, description, image data URI lokal/null. Shot: id, title, scene, action, dialogue, sound, camera, seconds (rencana), references UUID aset, review draft/reviewed, position x/y. Review tidak mencakup approval provider. Edit struktur shot, referensi, naskah, rasio atau mode adaptasi membatalkan peninjauan relevan. Parser menolak extra fields, ID duplikat, dangling references, URL media remote dan versi asing. Impor membuat project ID baru agar tidak menimpa sumber. JSON tidak menyertakan kredensial atau media provider.

## Profil API v1 — ADR-016
Kontrak executable: `src/contracts/providers.ts`; panduan dan contoh: [API-PROVIDERS](docs/API-PROVIDERS.md). Routing terpisah llm/image/video, profile UUID, protocol, base URL/endpoint/model, auth secretRef, mapping JSON Pointer/polling, declaredCapabilities dan cost. localStorage hanya konfigurasi nonrahasia. Tidak ada DTO submit aktif untuk API generik. Jangan menerima status verified dari impor config; validasi struktur tidak memberi izin eksekusi. Jurnal Nexabot dan command terkait sudah dihapus dari runtime. Data lama di mesin pengguna tidak dihapus otomatis.
