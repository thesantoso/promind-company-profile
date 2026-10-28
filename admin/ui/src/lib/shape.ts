/** Mengenali bentuk nilai JSON agar editor bisa memilih kontrol yang tepat tanpa formulir per berkas. */

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json };

export type Shape =
  | 'bilingual'
  | 'bilingualList'
  | 'image'
  | 'objectArray'
  | 'stringArray'
  | 'object'
  | 'route'
  | 'date'
  | 'email'
  | 'boolean'
  | 'number'
  | 'text';

export const isPlainObject = (v: unknown): v is JsonObject => v !== null && typeof v === 'object' && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

export function isBilingual(v: unknown): v is { id: string; en: string } {
  return isPlainObject(v) && Object.keys(v).length === 2 && typeof v.id === 'string' && typeof v.en === 'string';
}

export function isBilingualList(v: unknown): v is { id: string[]; en: string[] } {
  return isPlainObject(v) && Object.keys(v).length === 2 && isStringArray(v.id) && isStringArray(v.en);
}

export function isImage(v: unknown): v is { src: string; alt: { id: string; en: string } } {
  return isPlainObject(v) && typeof v.src === 'string' && isBilingual(v.alt);
}

export const DATE_KEYS = new Set(['postedAt', 'validThrough']);
export const EMAIL_KEYS = new Set(['email', 'applicationEmail']);

export function shapeOf(value: unknown, key: string): Shape {
  if (key === 'route' && typeof value === 'string') return 'route';
  if (DATE_KEYS.has(key) && (typeof value === 'string' || value === undefined)) return 'date';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' || value === undefined || value === null) return EMAIL_KEYS.has(key) ? 'email' : 'text';
  if (Array.isArray(value)) return value.length > 0 && value.every(isPlainObject) ? 'objectArray' : value.every((x) => typeof x === 'string') ? 'stringArray' : 'objectArray';
  if (isBilingual(value)) return 'bilingual';
  if (isBilingualList(value)) return 'bilingualList';
  if (isImage(value)) return 'image';
  return 'object';
}

const LONG_KEYS = new Set(['summary', 'description', 'body', 'detail', 'scope', 'message', 'story', 'address', 'subtitle']);

/** `<textarea>` untuk kunci teks panjang, judul > 80 karakter, atau teks apa pun > 80 karakter. */
export function isLongText(key: string, texts: readonly string[]): boolean {
  if (LONG_KEYS.has(key)) return true;
  return texts.some((t) => t.length > 80);
}

/** Kunci opsional yang tetap ditampilkan walau tidak ada di data, per berkas. */
export const OPTIONAL_KEYS: Record<string, { key: string; after: string }[]> = {
  careers: [{ key: 'validThrough', after: 'postedAt' }],
};

/** Urutan kunci untuk satu objek, termasuk kunci opsional yang belum diisi. */
export function keysFor(obj: JsonObject, fileKey: string, isRootItem: boolean): string[] {
  const keys = Object.keys(obj);
  if (!isRootItem) return keys;
  for (const { key, after } of OPTIONAL_KEYS[fileKey] ?? []) {
    if (keys.includes(key)) continue;
    const at = keys.indexOf(after);
    keys.splice(at < 0 ? keys.length : at + 1, 0, key);
  }
  return keys;
}

/** Struktur yang sama dengan nilai kosong. Larik menyisakan satu butir kosong (skema mewajibkan minimal satu). */
export function emptyLike(v: Json): Json {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (v === null) return null;
  if (Array.isArray(v)) return v.length > 0 ? [emptyLike(v[0]!)] : [];
  const out: JsonObject = {};
  for (const [k, x] of Object.entries(v)) out[k] = emptyLike(x);
  return out;
}

/** Butir baru untuk sebuah daftar: struktur butir pertama, dikosongkan, dengan default per berkas. */
export function newItemFor(fileKey: string, template: Json, today: string): Json {
  const item = emptyLike(template);
  if (isPlainObject(item) && fileKey === 'careers') {
    item.postedAt = today;
    item.active = false;
    delete item.validThrough;
  }
  return item;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((x, i) => deepEqual(x, bb[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return [...arr];
  const out = [...arr];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x!);
  return out;
}

export function removeAt<T>(arr: readonly T[], i: number): T[] {
  return arr.filter((_, j) => j !== i);
}
