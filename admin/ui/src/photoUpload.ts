import { ApiError, api } from './api';
import { compressionPlan, jpegName, needsProcessing, TARGET_BYTES } from './lib/imageSizing';

export interface Uploaded {
  name: string;
  width: number;
  height: number;
  size: number;
}

/** Dekode langsung dari Blob (tanpa URL blob:, sehingga tidak bentrok dengan CSP). */
async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * Mengecilkan foto besar di browser (JPEG kualitas ~0,82, lebar maks. 2000 px) agar muat di batas 1,5 MB.
 * Berkas yang tidak bisa dibaca browser dikirim apa adanya supaya server yang memberi alasan penolakannya.
 */
export async function prepareImage(file: File): Promise<{ file: File; resized: boolean }> {
  const img = await decode(file);
  if (!img) return { file, resized: false };
  if (!needsProcessing(file, img.width)) {
    img.close();
    return { file, resized: false };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    img.close();
    return { file, resized: false };
  }
  let best: Blob | null = null;
  for (const step of compressionPlan(img.width, img.height)) {
    canvas.width = step.width;
    canvas.height = step.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, step.width, step.height);
    ctx.drawImage(img, 0, 0, step.width, step.height);
    const blob = await toBlob(canvas, step.quality);
    if (blob) best = blob;
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  img.close();
  if (!best) return { file, resized: false };
  return { file: new File([best], jpegName(file.name), { type: 'image/jpeg' }), resized: true };
}

export async function uploadImage(file: File, overwrite = false): Promise<Uploaded> {
  const form = new FormData();
  form.append('file', file, file.name);
  if (overwrite) form.append('overwrite', 'true');
  return api<Uploaded>('POST', '/api/images', undefined, { form });
}

export { ApiError };
