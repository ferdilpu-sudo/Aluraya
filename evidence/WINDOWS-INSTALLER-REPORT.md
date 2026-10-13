# TASK-006 — kemasan installer Windows

13 Oktober 2026. REQ-014/REQ-015, bagian packaging M-001. Flow pilihan A tetap BLOCKED; pemeriksaan ini independen dari login provider.

## Perubahan

Workflow Windows membangun NSIS melalui `npm run tauri build -- --bundles nsis`, menggantikan executable-only `--no-bundle`. Artifact menyertakan setup.exe, executable dan Cargo.lock hasil resolusi. Tidak ada publikasi GitHub Release atau pembelian sertifikat/billing.

Skrip `scripts/check-windows-installer.mjs` dibatasi ke Windows GitHub Actions pada runner sementara. Ia memasang paket ke direktori unik dengan spasi, membandingkan hash file aplikasi/runtime/sidecar/lisensi serta seluruh isi playwright-core, mengecek hash Node terhadap runtime.json, lalu mengirim satu health.inspect ke sidecar terpasang dan memeriksa request ID, versi Node dan clean exit. Node dipanggil dari paket dengan cwd di luar repository; NODE_PATH/NODE_OPTIONS dan direktori auth/Flow dihapus dari lingkungan child. Tidak membuka browser atau akun.

Uninstall memakai mode silent dan `_?=` agar runner menunggu proses sebenarnya. Pemeriksaan memastikan aplikasi, Node dan entrypoint sidecar dihapus. Status gagal tidak dipromosikan menjadi PASS dan report ditulis meskipun tahap sebelumnya gagal.

## Hasil

Syntax Node, Prettier dan lint skrip: PASS. Pemeriksaan NSIS/install/runtime/uninstall nyata: PENDING CI Windows. Output terukur disimpan pada artifact aluraya-installer-check/installer-check.json.

## Batas

GUI hasil instalasi, startup host–sidecar melalui UI, upgrade instalasi lama, pemulihan data, Windows LTSC tanpa WebView2, penggunaan offline, tanda tangan dan performa RAM pengguna: NOT RUN. Tidak ada klaim M-001 atau REQ-015 selesai. Cargo.lock hasil CI ikut artifact; belum dipin di source. Native executable 0f163ae sebelumnya PASS bukan bukti installer baru lulus.

Sumber teknis primer: https://v2.tauri.app/distribute/windows-installer/ dan https://nsis.sourceforge.io/Docs/Chapter3.html (opsi /S, /D= dan _?=), diperiksa 13 Oktober 2026.


## Iterasi pertama: build/install/uninstall PASS, validator executable FAIL

Run 38397630182 / commit 20aba2e membangun installer 27,505,783 byte. Install dan uninstall silent berhasil. Validator menghentikan tahap resource karena hash executable terpasang berbeda. Source Tauri menjelaskan patch marker `__TAURI_BUNDLE_TYPE_VAR_UNK` menjadi `__TAURI_BUNDLE_TYPE_VAR_NSS` saat bundling, kemudian mengembalikan executable build ke semula. Karena itu hash build mentah bukan pembanding yang tepat.

Perbaikan validator menghitung salinan executable yang diharapkan dengan satu perubahan marker tersebut dan membandingkan seluruh byte hasilnya; source tidak diubah dan perbedaan byte lain tetap gagal. Marker hilang/duplikat ditolak. Tiga tes memeriksa patch normal, korupsi/truncation/wrong type dan perubahan marker. Ini koreksi pemeriksaan, bukan pelemahan atau penonaktifan patch Tauri. Pemeriksaan resource dan IPC terpasang tetap harus lulus di run berikutnya.

Sumber: https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle.rs (patch_binary dan pemulihan main_binary_copy), diperiksa 13 Oktober 2026.
