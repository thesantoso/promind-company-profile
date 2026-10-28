import type { Ctx, User } from './auth';
import { writeAudit } from './db';

export const PHOTOS_DIR = 'web/src/assets/photos';
export const MAX_IMAGE_BYTES = 1_500_000;
export const MIN_WIDTH = 800;
const MAX_DIMENSION = 8000;

export type ImageErrorCode = 'bad_name' | 'not_jpeg' | 'too_large' | 'too_small' | 'exists';

export class ImageError extends Error {
  constructor(readonly code: ImageErrorCode, message: string = code) {
    super(message);
  }
}

/** Dimensi dari penanda SOF; null bila bukan JPEG valid. Tidak pernah membaca di luar buffer. */
export function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return null;
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1]!;
    while (marker === 0xff && i + 2 < b.length) {
      i++;
      marker = b[i + 1]!;
    }
    if (marker === 0xd9 || marker === 0xda) return null; // EOI / SOS sebelum SOF
    const len = (b[i + 2]! << 8) | b[i + 3]!;
    if (len < 2) return null;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 8 >= b.length) return null;
      const height = (b[i + 5]! << 8) | b[i + 6]!;
      const width = (b[i + 7]! << 8) | b[i + 8]!;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    i += 2 + len;
  }
  return null;
}

/** Nama berkas aman: huruf kecil, angka, tanda hubung, berakhiran .jpg. Menolak ekstensi ganda dan karakter aneh. */
export function normalizeImageName(raw: string): string {
  const base = String(raw).split(/[\\/]/).pop() ?? '';
  if (/[\u0000-\u001f]/.test(base)) throw new ImageError('bad_name', 'Nama berkas tidak valid');
  const m = base.match(/^(.+)\.(jpe?g)$/i);
  if (!m) throw new ImageError('bad_name', 'Hanya berkas .jpg atau .jpeg');
  const stem = m[1]!.toLowerCase().replace(/[\s_]+/g, '-');
  if (stem.includes('.')) throw new ImageError('bad_name', 'Nama berkas tidak boleh memuat titik');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem) || stem.length > 60) throw new ImageError('bad_name', 'Gunakan huruf, angka, dan tanda hubung (maks. 60 karakter)');
  return `${stem}.jpg`;
}

export async function saveDraftImage(
  c: Ctx,
  user: User,
  filename: string,
  bytes: Uint8Array,
  opts: { existing: Set<string>; overwrite?: boolean },
): Promise<{ name: string; path: string; width: number; height: number; size: number }> {
  const name = normalizeImageName(filename);
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageError('too_large', 'Ukuran berkas maksimal 1,5 MB');
  const size = jpegSize(bytes);
  if (!size) throw new ImageError('not_jpeg', 'Berkas bukan JPEG yang valid');
  if (size.width > MAX_DIMENSION || size.height > MAX_DIMENSION) throw new ImageError('too_large', 'Dimensi gambar terlalu besar');
  if (size.width < MIN_WIDTH) throw new ImageError('too_small', `Lebar gambar minimal ${MIN_WIDTH} px`);
  if (opts.existing.has(name) && !opts.overwrite) throw new ImageError('exists', `Foto "${name}" sudah ada`);

  const path = `${PHOTOS_DIR}/${name}`;
  await c.db
    .prepare(
      `INSERT INTO draft_images (path, mime, data, created_by, created_at) VALUES (?, 'image/jpeg', ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET data = excluded.data, created_by = excluded.created_by, created_at = excluded.created_at`,
    )
    .bind(path, bytes, user.id, Math.floor(c.now() / 1000))
    .run();
  await writeAudit(c.db, c.now(), user.id, 'image.upload', { name, bytes: bytes.length });
  return { name, path, width: size.width, height: size.height, size: bytes.length };
}

const toBytes = (v: unknown): Uint8Array =>
  v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : Uint8Array.from(v as number[]);

export async function getDraftImage(c: Ctx, name: string): Promise<Uint8Array | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.jpg$/.test(name)) return null;
  const row = await c.db.prepare('SELECT data FROM draft_images WHERE path = ?').bind(`${PHOTOS_DIR}/${name}`).first<{ data: unknown }>();
  return row ? toBytes(row.data) : null;
}

export async function listDraftImageNames(c: Ctx): Promise<string[]> {
  const { results } = await c.db.prepare('SELECT path FROM draft_images ORDER BY path').all<{ path: string }>();
  return results.map((r) => r.path.split('/').pop()!);
}
