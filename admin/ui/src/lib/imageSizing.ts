/** Perhitungan murni untuk kompresi foto di browser sebelum diunggah. */

export const MAX_UPLOAD_BYTES = 1_500_000;
export const MIN_WIDTH = 800;
export const MAX_WIDTH = 2000;
export const QUALITY_STEPS = [0.82, 0.72, 0.62] as const;
/** Batas aman di bawah 1,5 MB (memberi ruang untuk header multipart). */
export const TARGET_BYTES = 1_400_000;

/** Ukuran baru dengan lebar maksimum `maxWidth`, rasio dipertahankan, tidak pernah diperbesar. */
export function fitWithin(width: number, height: number, maxWidth = MAX_WIDTH): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  const scale = maxWidth / width;
  return { width: maxWidth, height: Math.max(1, Math.round(height * scale)) };
}

/** Perlu diproses ulang bila terlalu besar, terlalu lebar, atau bukan JPEG. */
export function needsProcessing(file: { size: number; type: string }, width: number): boolean {
  return file.size > TARGET_BYTES || width > MAX_WIDTH || file.type !== 'image/jpeg';
}

/** Rencana percobaan: tiap kualitas di lebar penuh, lalu lebar diperkecil 20% per langkah (tidak di bawah 800 px). */
export function compressionPlan(width: number, height: number): { width: number; height: number; quality: number }[] {
  const base = fitWithin(width, height);
  const plan = QUALITY_STEPS.map((quality) => ({ ...base, quality }));
  let w = base.width;
  while (w * 0.8 >= MIN_WIDTH) {
    w = Math.round(w * 0.8);
    plan.push({ ...fitWithin(base.width, base.height, w), quality: QUALITY_STEPS[1] });
  }
  return plan;
}

/** Nama berkas tujuan: ekstensi selalu `.jpg`, nama lain dibiarkan untuk diperiksa server. */
export function jpegName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '');
  return `${stem || 'foto'}.jpg`;
}

/** Nama yang akan dipakai server (huruf kecil, spasi/garis bawah → tanda hubung), untuk pratinjau. */
export function normalizedName(name: string): string {
  const stem = jpegName(name).replace(/\.jpg$/, '').toLowerCase().replace(/[\s_]+/g, '-');
  return `${stem}.jpg`;
}
