const errors: Record<string, string> = {
  WINDOWS_REQUIRED: 'Koneksi Flow tersedia melalui Aluraya Windows.',
  STORAGE_ERROR:
    'Profil tidak dapat disimpan atau dibaca. Jangan hapus data profil; kirim rincian kegagalannya.',
  PROFILE_IN_USE: 'Profil sedang dipakai proses Aluraya lain. Tutup jendela Aluraya duplikat.',
  BROWSER_OPEN_FAILED:
    'WebView2 gagal dibuka. Periksa runtime WebView2 dan tutup Aluraya duplikat.',
  BROWSER_CLOSE_FAILED:
    'Jendela Flow belum berhasil ditutup. Tutup jendelanya sebelum membuka profil lain.',
  PROFILE_ACTIVE: 'Tutup seluruh jendela Flow aktif sebelum membuka profil lain.',
  PROFILE_NOT_FOUND: 'Profil tidak ditemukan. Periksa ulang daftar profil.',
  NAVIGATION_BLOCKED:
    'Navigasi di luar halaman Google yang didukung diblokir. Kirim nama domain yang ingin dibuka, tanpa URL login lengkap.',
  POPUP_BLOCKED:
    'Popup diblokir karena tujuan tidak didukung atau terlalu banyak jendela. Tutup popup yang tidak diperlukan.',
  POPUP_FAILED: 'Popup tidak berhasil dibuka. Tutup browser Flow dan kirim rincian yang tampil.',
  BUSY: 'Tunggu operasi browser Flow selesai.',
};
export function flowError(error: unknown): string {
  return typeof error === 'string' && errors[error]
    ? errors[error]
    : 'Koneksi desktop tidak tersedia. Buka Aluraya Windows; kirim rincian bila masalah berlanjut.';
}
