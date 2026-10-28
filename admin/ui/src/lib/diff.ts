import { humanPath, itemSummary } from './labels';
import { joinPath } from './paths';
import { isPlainObject } from './shape';

export interface DiffEntry {
  path: string;
  label: string;
  kind: 'changed' | 'added' | 'removed';
  before: string | null;
  after: string | null;
}

const show = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return itemSummary(v) ?? JSON.stringify(v);
};

/**
 * Daftar perubahan yang mudah dibaca antara versi live dan draf.
 * Larik dibandingkan per posisi; butir objek yang ditambah/dihapus dilaporkan sebagai satu entri.
 */
export function buildDiff(before: unknown, after: unknown, fileKey: string): DiffEntry[] {
  const out: DiffEntry[] = [];
  const label = (path: string, side: unknown) => humanPath(path, fileKey, side);

  function walk(a: unknown, b: unknown, path: string): void {
    if (a === b) return;
    if (a === undefined) {
      out.push({ path, label: label(path, after), kind: 'added', before: null, after: show(b) });
      return;
    }
    if (b === undefined) {
      out.push({ path, label: label(path, before), kind: 'removed', before: show(a), after: null });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const n = Math.max(a.length, b.length);
      for (let i = 0; i < n; i++) walk(a[i], b[i], joinPath(path, i));
      return;
    }
    if (isPlainObject(a) && isPlainObject(b)) {
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
      for (const k of keys) walk(a[k], b[k], joinPath(path, k));
      return;
    }
    out.push({ path, label: label(path, after), kind: 'changed', before: show(a), after: show(b) });
  }

  walk(before, after, '');
  return out;
}
