import { findBrandViolations } from '../../web/src/content/brand';
import * as s from '../../web/src/content/schema';
import { allStrings, englishStrings, findBritishSpelling, findUnexplainedAbbreviations } from '../../web/src/content/rules';

export type ContentKey =
  | 'settings' | 'pages' | 'services' | 'property-types' | 'pillars' | 'fieldwork'
  | 'engagement' | 'standards' | 'portfolio' | 'clients' | 'insights' | 'careers';

interface SchemaLike {
  safeParse(v: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } };
}

export interface FileDef {
  label: string;
  path: string;
  kind: 'object' | 'array';
  /** Skema satu objek (kind "object") atau satu butir (kind "array"). */
  schema: SchemaLike;
  slugged: boolean;
}

const def = (key: ContentKey, label: string, kind: FileDef['kind'], schema: SchemaLike, slugged = false): FileDef => ({
  label, path: `web/content/${key}.json`, kind, schema, slugged,
});

export const CONTENT_FILES: Record<ContentKey, FileDef> = {
  settings: def('settings', 'Pengaturan situs', 'object', s.siteSettingsSchema),
  pages: def('pages', 'Teks halaman dan SEO', 'object', s.pagesSchema),
  services: def('services', 'Layanan', 'array', s.serviceSchema, true),
  'property-types': def('property-types', 'Sektor properti', 'array', s.propertyTypeSchema, true),
  pillars: def('pillars', 'Nilai perusahaan', 'array', s.pillarSchema, true),
  fieldwork: def('fieldwork', 'Eksekusi lapangan', 'array', s.fieldworkSchema, true),
  engagement: def('engagement', 'Model kerja sama', 'array', s.engagementSchema, true),
  standards: def('standards', 'Standar dan sistem', 'array', s.standardSchema),
  portfolio: def('portfolio', 'Portofolio', 'array', s.portfolioSchema),
  clients: def('clients', 'Klien', 'array', s.clientSchema),
  insights: def('insights', 'Wawasan', 'array', s.insightSchema, true),
  careers: def('careers', 'Lowongan', 'array', s.jobSchema, true),
};

export const CONTENT_KEYS = Object.keys(CONTENT_FILES) as ContentKey[];
export const isContentKey = (k: string): k is ContentKey => k in CONTENT_FILES;

export interface Issue {
  path: string;
  message: string;
}

const fmt = (path: PropertyKey[]): string =>
  path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`)).join('');

export const serializeContent = (data: unknown): string => JSON.stringify(data, null, 2) + '\n';

export function validateContent(key: ContentKey, data: unknown, opts: { knownImages: Set<string> }): Issue[] {
  const d = CONTENT_FILES[key];
  const issues: Issue[] = [];
  const isObj = data !== null && typeof data === 'object' && !Array.isArray(data);

  if (d.kind === 'array' ? !Array.isArray(data) : !isObj) {
    return [{ path: '', message: d.kind === 'array' ? 'Isi berkas harus berupa daftar' : 'Isi berkas harus berupa objek' }];
  }

  const items: [string, unknown][] = d.kind === 'array' ? (data as unknown[]).map((v, i) => [`[${i}]`, v]) : [['', data]];
  for (const [prefix, item] of items) {
    const r = d.schema.safeParse(item);
    if (!r.success) {
      for (const i of r.error?.issues ?? []) {
        const tail = fmt(i.path);
        issues.push({ path: prefix + (prefix && tail && !tail.startsWith('[') ? '.' : '') + tail, message: i.message });
      }
    }
  }

  if (d.slugged && Array.isArray(data)) {
    const seen = new Map<string, number>();
    (data as { slug?: unknown }[]).forEach((item, i) => {
      if (typeof item?.slug !== 'string') return;
      if (seen.has(item.slug)) issues.push({ path: `[${i}].slug`, message: `Duplicate slug "${item.slug}" (also at [${seen.get(item.slug)}])` });
      else seen.set(item.slug, i);
    });
  }

  for (const [path, text] of allStrings(data)) {
    for (const v of findBrandViolations(text)) issues.push({ path, message: `Penulisan brand salah: "${v}" (tulis PROMIND/PROAPPS dengan huruf kapital)` });
  }
  for (const [path, text] of englishStrings(data)) {
    for (const w of findBritishSpelling(text)) issues.push({ path, message: `Ejaan Inggris Britania "${w}": gunakan ejaan en-US` });
    for (const w of findUnexplainedAbbreviations(text)) issues.push({ path, message: `Singkatan "${w}" perlu dijelaskan: tulis "occupational health and safety"` });
  }

  if (key === 'fieldwork' && Array.isArray(data)) {
    (data as { image?: { src?: unknown } }[]).forEach((item, i) => {
      const src = item?.image?.src;
      if (typeof src === 'string' && !opts.knownImages.has(src)) {
        issues.push({ path: `[${i}].image.src`, message: `Foto "${src}" tidak ditemukan di repo atau unggahan draft` });
      }
    });
  }
  return issues;
}
