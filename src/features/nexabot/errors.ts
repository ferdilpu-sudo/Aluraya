import { nexaErrorSchema } from '../../contracts/nexabot';
const messages: Record<string, string> = {
  KEY_REQUIRED: 'Masukkan API key Nexabot terlebih dahulu.',
  INVALID_KEY: 'API key ditolak Nexabot. Periksa atau ganti key.',
  INSUFFICIENT_CREDIT: 'Saldo kredit Nexabot tidak cukup.',
  ACCESS_DENIED: 'Nexabot menolak akses. Periksa izin dan pemilik job.',
  NOT_FOUND: 'Job tidak ditemukan di Nexabot.',
  RATE_LIMIT: 'Layanan membatasi permintaan. Tunggu sebelum melanjutkan pemantauan.',
  INVALID_REQUEST: 'Nexabot menolak parameter permintaan.',
  NETWORK_ERROR:
    'Koneksi terputus atau batas waktu tercapai. Job yang sudah dikirim tidak diulang.',
  PROVIDER_ERROR: 'Layanan Nexabot mengalami kegagalan.',
  PROTOCOL_ERROR: 'Respons Nexabot tidak sesuai dokumentasi. Proses dihentikan.',
  STORAGE_ERROR: 'Penyimpanan lokal tidak dapat dibaca atau ditulis.',
  BUSY: 'Selesaikan job aktif atau operasi yang sedang berjalan terlebih dahulu.',
  APPROVAL_STALE: 'Persetujuan telah kedaluwarsa. Periksa biaya kembali.',
  COST_CHANGED: 'Biaya berubah. Periksa dan setujui biaya terbaru.',
  SUBMIT_UNCERTAIN:
    'Penerimaan request belum pasti. Jangan kirim ulang. Periksa riwayat Nexabot atau hubungi dukungannya; percobaan ini tetap tersimpan.',
  JOB_FAILED: 'Nexabot melaporkan job gagal. Periksa saldo untuk memastikan refund.',
  DOWNLOAD_FAILED:
    'Hasil belum tersimpan. Lanjutkan pengambilan job yang sama tanpa generasi baru.',
  DOWNLOAD_REDIRECT:
    'Unduhan diarahkan ke alamat yang belum didukung. Job tersimpan; laporkan masalah ini tanpa membuat generasi baru.',
  MEDIA_INVALID: 'Berkas hasil tidak sesuai format atau melampaui batas unduhan lokal.',
  KEY_MISMATCH: 'Gunakan API key yang sama dengan saat job dikirim.',
};
export function nexaErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : error;
  if (raw === 'DESKTOP_REQUIRED') return 'Koneksi Nexabot tersedia di aplikasi Windows.';
  const code = nexaErrorSchema.safeParse(raw);
  return code.success
    ? messages[code.data]!
    : 'Operasi Nexabot tidak selesai. Coba periksa status kembali.';
}
