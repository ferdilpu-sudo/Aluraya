import type { LlmErrorCode } from '../../contracts/llm';
export const llmErrors: Record<LlmErrorCode, string> = {
  BUSY: 'Tunggu pekerjaan aktif selesai.',
  CONFIG_REQUIRED: 'Terapkan koneksi LLM yang valid terlebih dahulu.',
  KEY_REQUIRED: 'Simpan API key untuk koneksi ini.',
  STORAGE_ERROR: 'Key belum berhasil dibaca atau disimpan. Periksa akses penyimpanan Windows.',
  INVALID_APPROVAL: 'Review sudah kedaluwarsa atau telah digunakan. Tinjau request lagi.',
  AUTH_REJECTED: 'Provider menolak key atau izin model.',
  RATE_LIMIT: 'Batas provider tercapai. Tidak ada pengiriman ulang otomatis.',
  PROVIDER_ERROR: 'Provider menolak request. Periksa endpoint, model dan parameter batas token.',
  INVALID_RESPONSE:
    'Respons tidak sesuai Chat Completions teks. Request mungkin sudah dikenai biaya.',
  OUTPUT_LIMIT: 'Respons melebihi batas aplikasi; request mungkin sudah dikenai biaya.',
  REQUEST_UNCERTAIN: 'Status request tidak pasti. Periksa pemakaian provider sebelum mencoba lagi.',
  CANCELLED_UNCERTAIN:
    'Penungguan dihentikan. Provider mungkin tetap memproses dan mengenakan biaya.',
};
