# TASK-002: perbaikan resolusi lisensi Node Windows

Tanggal: 12 Oktober 2026. Basis repo: 05094a7dd0c4e705a9f96813dc2e7184ccda4d9e.

Laporan pengguna menunjukkan build sidecar berhasil, lalu gagal karena asumsi hanya ada file bernama LICENSE di sebelah node.exe. Resolver sekarang menerima beberapa nama file teks lokal, mengambil LICENSE dari tag Node resmi sesuai versi jika tidak ada, dan menyimpan cache per versi. Teks dan sumber lisensi di-hash di metadata runtime. Bundling tetap menolak lisensi yang hilang/tidak valid.

Verifikasi:
- PASS: npm run check — format, lint, 20 tes (4 file), typecheck, build UI/sidecar.
- PASS: resolver sebenarnya dengan instalasi tanpa lisensi lokal mengambil https://raw.githubusercontent.com/nodejs/node/v24.19.0/LICENSE — 157606 byte.
- NOT RUN lokal: startup native Windows, installer, login ChatGPT/Flow. Host pengembangan Linux; laporan ini tidak mengklaim error native lain tidak ada.

Tidak ada perubahan package.json/package-lock.json atau upgrade dependency. Warning allow-scripts esbuild bukan titik kegagalan di log pengguna karena build sidecar sudah berhasil. Perubahan hanya TASK-002; M-001 tetap belum lulus.
