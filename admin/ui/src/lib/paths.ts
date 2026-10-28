/**
 * Path data konten dengan format yang sama seperti server:
 * indeks larik dalam kurung siku, kunci objek dipisah titik, tanpa titik di awal.
 * Contoh: `[2].title.en`, `list.en[1]`, `home.hero.cta.route`.
 */
export type Segment = string | number;

export function joinPath(parent: string, seg: Segment): string {
  if (typeof seg === 'number') return `${parent}[${seg}]`;
  return parent ? `${parent}.${seg}` : seg;
}

export function parsePath(path: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[(\d+)\]|\.?([^.[\]]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push(Number(m[1]));
    else if (m[2] !== undefined) out.push(m[2]);
  }
  return out;
}

export function formatPath(segs: Segment[]): string {
  return segs.reduce<string>((p, s) => joinPath(p, s), '');
}

/** Path induk langsung, atau null untuk akar. */
export function parentPath(path: string): string | null {
  if (path === '') return null;
  const segs = parsePath(path);
  segs.pop();
  return formatPath(segs);
}

/** ID elemen DOM yang aman dan unik untuk satu path. */
export function fieldId(path: string): string {
  return 'f-' + (path === '' ? 'root' : path.replace(/[^A-Za-z0-9_-]/g, (c) => `-${c.charCodeAt(0).toString(16)}-`));
}

export interface PathIssue {
  path: string;
  message: string;
}

/** Masalah yang path-nya persis sama. */
export function issuesAt(issues: readonly PathIssue[], path: string): PathIssue[] {
  return issues.filter((i) => i.path === path);
}

/**
 * Elemen terdekat untuk sebuah path masalah: path itu sendiri bila ada, kalau tidak induk-induknya.
 * `exists` menjawab apakah ada kontrol untuk path tersebut.
 */
export function closestPath(path: string, exists: (p: string) => boolean): string | null {
  let p: string | null = path;
  while (p !== null) {
    if (exists(p)) return p;
    p = parentPath(p);
  }
  return null;
}

export function getIn(value: unknown, segs: readonly Segment[]): unknown {
  let v: unknown = value;
  for (const s of segs) {
    if (v === null || typeof v !== 'object') return undefined;
    v = (v as Record<string | number, unknown>)[s];
  }
  return v;
}
