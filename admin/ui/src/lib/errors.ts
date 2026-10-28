/** Pesan Indonesia untuk kode galat API. Konteks (`login`, `photo`, …) memilih kalimat yang paling membantu. */

import { formatWait } from './format';

const COMMON: Record<string, string> = {
  network: 'Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.',
  internal: 'Terjadi kesalahan di server. Coba lagi sebentar lagi.',
  bad_request: 'Permintaan tidak valid. Muat ulang halaman lalu coba lagi.',
  bad_origin: 'Permintaan ditolak karena berasal dari alamat lain. Buka portal dari alamat resminya.',
  bad_csrf: 'Sesi keamanan halaman ini sudah tidak berlaku. Muat ulang halaman lalu coba lagi.',
  forbidden: 'Anda tidak punya izin untuk tindakan ini.',
  not_found: 'Data yang dicari tidak ditemukan.',
  unauthenticated: 'Sesi Anda sudah berakhir. Silakan masuk lagi.',
  invalid_credentials: 'Email, kata sandi, atau kode tidak cocok. Periksa lagi lalu coba ulang.',
  invalid_code: 'Kode verifikasi salah atau sudah kedaluwarsa. Masukkan kode terbaru dari aplikasi autentikator.',
  invalid_invite: 'Undangan ini tidak berlaku atau sudah kedaluwarsa (undangan berlaku 72 jam). Minta administrator membuat undangan baru.',
  weak_password: 'Kata sandi terlalu lemah: minimal 12 karakter dan tidak boleh berupa nama atau email Anda.',
  email_taken: 'Sudah ada pengguna dengan email ini.',
  last_administrator: 'Harus selalu ada minimal satu administrator aktif. Jadikan pengguna lain administrator terlebih dahulu, baru ubah akun ini.',
  github_unavailable: 'Penyimpanan konten (GitHub) sedang tidak bisa dihubungi. Draf Anda aman; coba terbitkan lagi beberapa menit lagi.',
  repo_busy: 'Ada penerbitan lain yang sedang berjalan. Tunggu sebentar lalu coba lagi.',
  no_draft: 'Tidak ada draf untuk diterbitkan. Mungkin sudah diterbitkan atau dibuang oleh pengguna lain. Muat ulang halaman.',
  conflict: 'Berkas ini sudah diubah di tempat lain setelah draf Anda dimulai. Buang draf lalu muat ulang, kemudian ulangi perubahan Anda.',
  draft_exists: 'Masih ada draf untuk berkas ini. Terbitkan atau buang draf itu dulu sebelum memulihkan versi lama.',
  invalid: 'Masih ada isian yang perlu diperbaiki.',
  too_large: 'Berkas terlalu besar.',
  not_jpeg: 'Berkas bukan foto JPEG yang valid. Simpan foto sebagai .jpg lalu coba lagi.',
  too_small: 'Foto terlalu kecil: lebar minimal 800 piksel. Pakai foto dengan resolusi lebih tinggi.',
  bad_name: 'Nama berkas tidak valid. Gunakan huruf, angka, dan tanda hubung saja (maks. 60 karakter), berakhiran .jpg, tanpa titik lain di nama.',
  exists: 'Sudah ada foto dengan nama ini.',
};

const PHOTO: Record<string, string> = {
  too_large: 'Foto masih lebih besar dari 1,5 MB setelah dikecilkan. Coba foto lain atau kecilkan dulu di ponsel/komputer.',
};

const DRAFT: Record<string, string> = {
  too_large: 'Draf terlalu besar untuk disimpan.',
};

export function errorMessage(code: string, ctx: 'photo' | 'draft' | 'general' = 'general', retryAfter?: number): string {
  if (code === 'rate_limited') {
    return retryAfter
      ? `Terlalu banyak percobaan. Demi keamanan, coba lagi dalam ${formatWait(retryAfter)}.`
      : 'Terlalu banyak percobaan. Demi keamanan, tunggu beberapa menit lalu coba lagi.';
  }
  const table = ctx === 'photo' ? PHOTO : ctx === 'draft' ? DRAFT : {};
  return table[code] ?? COMMON[code] ?? `Terjadi kesalahan (${code}). Coba lagi.`;
}
