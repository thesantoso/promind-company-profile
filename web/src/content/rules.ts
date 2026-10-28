/** Aturan konten yang dipakai bersama oleh tes situs dan portal admin. */

const BRITISH =
  /\b(centre|centres|storey|storeys|colour|labour|licence|programme|behaviour|favour|organis\w*|optimis\w*|analyse\w*|whilst|grey)\b/gi;

/** Ejaan Inggris Britania yang ditemukan (situs ini en-US). */
export function findBritishSpelling(text: string): string[] {
  return [...text.matchAll(BRITISH)].map((m) => m[0]);
}

/** Singkatan yang tidak jelas bagi pembaca AS jika ditulis sendirian. */
export function findUnexplainedAbbreviations(text: string): string[] {
  return [...text.matchAll(/\bOHS\b/g)].map((m) => m[0]);
}

/** Istilah yang tidak boleh tampil di situs publik (keputusan pemilik). */
const FORBIDDEN = /\bproapps\b/gi;

export function findForbiddenTerms(text: string): string[] {
  return [...text.matchAll(FORBIDDEN)].map((m) => m[0]);
}

type Entry = [path: string, value: string];

/** Semua string beserta path-nya, mis. `list.en[1]` atau `[2].title.id`. */
export function allStrings(value: unknown, path = ''): Entry[] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => allStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => allStrings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

/** Hanya string di bawah kunci `en`. */
export function englishStrings(value: unknown, path = ''): Entry[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => englishStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) =>
      k === 'en' ? allStrings(v, path ? `${path}.en` : 'en') : englishStrings(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
}
