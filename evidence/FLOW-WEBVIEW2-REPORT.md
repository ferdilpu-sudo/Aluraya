# TASK-004 — browser WebView2 native

14 Oktober 2026. REQ-007/REQ-008; M-001 belum lulus.

## Dasar keputusan

Pengguna melaporkan akun yang sama bisa membuka Flow di Chrome biasa serta WebView2 Switchly, dan meminta pendekatan Switchly untuk Aluraya. Source Switchly yang diperiksa memakai CoreWebView2Environment standar, folder profil akun, dan popup dengan environment pembuka yang sama. Ini dasar evaluasi kompatibilitas; bukan bukti bahwa Google menerima WebView2 Aluraya atau memberi kontrak integrasi generasi.

## Implementasi

- `src-tauri/src/flow/`: registry profil atomik + lock Windows, policy navigasi, lifecycle jendela dan popup; satu profil aktif, pagination sepuluh profil per halaman.
- `flow_action` kini dimiliki native host, hanya dari jendela main dengan capability lokal. DTO Flow v2 tidak menerima URL/path/script/cookie atau command submit.
- Popup dibangun dari about:blank dan `window_features` pembuka; Tauri meneruskan environment WebView2 yang sama di Windows. Profil Aluraya baru terpisah dari browser harian, Switchly, dan profil Playwright lama.
- Tidak ada User-Agent override, login DOM automation, cookie import, endpoint privat, flag stealth atau fallback browser setelah penolakan. Argumen browser kosong eksplisit menjaga default WebView2, menggantikan default tambahan Wry yang mematikan beberapa fitur browser.
- Host hanya mengklasifikasi URL; query/fragment/judul halaman tidak dikirim ke UI atau log. Origin tampil di panel dan host tampil di judul native. Tidak mengklaim signedIn/costVerified dari URL.
- Menutup browser menutup popup sesi yang sama; sesi tidak dilepas sebelum jendela native hilang. Menutup main mengakhiri aplikasi. Halaman remote tidak diberi capability IPC; navigasi menuju origin lokal dan skema non-HTTPS diblokir, kecuali about:blank untuk popup.
- Sidecar Flow dan dependensi Playwright dihapus; sidecar sekarang menolak flow.action. Profil lama tetap utuh pada disk. Packaging tidak lagi menyertakan Playwright dan smoke installer memeriksa ketidakhadirannya.

## Verifikasi

Lokal Linux: `npm run check` PASS — format/lint/type/build, 68 tes PASS dan 1 tes DPAPI Windows skipped. Tes Playwright lama dihapus bersama adapter; empat tes TS baru memeriksa kontrak native, gate generasi, penolakan sidecar lama dan redaksi error. Lima tes Rust memeriksa kontrak, URL/origin, prioritas popup penolakan, registry invalid/duplicate, persistensi 25 profil dan lock Windows.

CI Windows native/installer: PENDING. Live WebView2 Aluraya, popup/login, persistensi sesi setelah restart dan cleanup UI: NOT RUN. Login atau generasi tidak dijalankan dalam CI. Tidak mengklaim Flow siap atau M-001 PASS.

## Referensi implementasi

- Switchly: BrowserEnvironmentPool.cs, BrowserWorkspace.Initialization.cs, BrowserWorkspace.Events.cs dan ManagedBrowserWindows.cs di https://github.com/ferdilpu-sudo/Switchly/tree/main/src/Switchly.App/Browser .
- Tauri WebviewWindowBuilder: https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html ; contoh on_new_window membuat about:blank dengan window_features, lalu NewWindowResponse::Create.
- Source Tauri webview/webview_window.rs: window_features meneruskan features.opener().environment di Windows.

Bila Google menolak akses baru ini, berhenti pada modul provider dan simpan pesan; tidak mencoba penyamaran atau pemindahan sesi. Browser kompatibel tidak membuktikan izin/biaya generasi.
