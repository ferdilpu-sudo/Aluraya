import type { ChatErrorCode } from '../../contracts/chat';

export const chatErrors: Record<ChatErrorCode, string> = {
  WINDOWS_REQUIRED: 'Koneksi ini tersedia melalui aplikasi Windows.',
  STORAGE_ERROR:
    'Penyimpanan kredensial Windows gagal. Tutup dan buka kembali aplikasi; jangan hapus data akun.',
  SESSION_IN_USE: 'Koneksi sedang dipakai jendela Aluraya lain. Tutup jendela tersebut.',
  NETWORK_ERROR: 'Koneksi terputus atau melewati batas waktu. Tidak ada pengiriman ulang otomatis.',
  PROVIDER_ERROR: 'Respons layanan tidak dapat diproses. Buka rincian kegagalan untuk pemeriksaan.',
  LOGIN_CANCELLED: 'Operasi dibatalkan.',
  LOGIN_TIMEOUT: 'Waktu login habis. Mulai login kembali.',
  LOGIN_DENIED: 'Izin login ditolak. Anda dapat memulai kembali jika ingin menghubungkan akun.',
  INVALID_CALLBACK: 'Hasil login tidak cocok dengan permintaan. Mulai login kembali.',
  INVALID_IDENTITY: 'Identitas akun tidak dapat diverifikasi. Kredensial baru tidak digunakan.',
  LOGIN_REQUIRED: 'Sesi perlu diperbarui. Pilih Continue with ChatGPT.',
  PLAN_PERMISSION_REQUIRED:
    'Akun terhubung, tetapi izin penggunaan paket belum diberikan. Login kembali untuk mengizinkannya.',
  PLAN_CONFIRMATION_REQUIRED: 'Tinjau pengaturan penggunaan paket sebelum mengirim pesan.',
  USAGE_LIMIT:
    'Batas penggunaan tercapai. Buka Manage usage untuk memeriksa batas akun atau aplikasi.',
  USAGE_UNAVAILABLE: 'Penggunaan paket belum dapat diperiksa. Coba lagi nanti.',
  NOT_ELIGIBLE: 'Penggunaan paket belum tersedia untuk akun atau workspace ini.',
  ACCESS_DENIED: 'Layanan menolak akses. Periksa izin akun atau workspace.',
  UNSUPPORTED_REQUEST: 'Model atau jenis permintaan belum didukung melalui penggunaan paket.',
  INVALID_MODEL: 'Pilih model dari daftar akun yang aktif.',
  BUSY: 'Tunggu operasi yang sedang berjalan.',
  STREAM_INTERRUPTED: 'Respons terputus sebelum selesai. Teks yang terlihat masih parsial.',
  RESPONSE_INCOMPLETE:
    'Layanan mengakhiri respons sebelum selesai. Teks yang terlihat masih parsial.',
  OUTPUT_LIMIT: 'Respons melampaui batas 6.000 karakter untuk pembuktian awal. Teks ini parsial.',
  CONTEXT_LIMIT: 'Percakapan mencapai batas konteks pembuktian awal. Mulai percakapan baru.',
  REVOCATION_UNCONFIRMED:
    'Sesi lokal sudah keluar; pencabutan sesi di layanan belum terkonfirmasi. Putuskan akses melalui pengaturan ChatGPT.',
};
