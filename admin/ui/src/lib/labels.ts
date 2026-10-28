import { getIn, parsePath, type Segment } from './paths';

/** Label Indonesia untuk kunci yang dikenal di berkas konten. */
export const KEY_LABELS: Record<string, string> = {
  id: 'Indonesia',
  en: 'English (US)',
  // umum
  slug: 'Slug (alamat halaman)',
  title: 'Judul',
  summary: 'Ringkasan',
  description: 'Deskripsi',
  detail: 'Detail',
  body: 'Isi',
  subtitle: 'Subjudul',
  eyebrow: 'Label di atas judul',
  name: 'Nama',
  code: 'Kode',
  category: 'Kategori',
  image: 'Foto',
  src: 'Berkas foto',
  alt: 'Teks alternatif foto',
  // halaman
  home: 'Beranda',
  services: 'Halaman Layanan',
  portfolio: 'Halaman Portofolio',
  insights: 'Halaman Wawasan',
  about: 'Halaman Tentang kami',
  careers: 'Halaman Karier',
  contact: 'Halaman Kontak',
  seo: 'SEO (judul dan deskripsi di hasil pencarian)',
  hero: 'Banner utama',
  cta: 'Tombol ajakan',
  label: 'Teks tombol',
  route: 'Halaman tujuan',
  secondaryLink: 'Tautan kedua',
  cardLink: 'Tautan di kartu',
  imageAlt: 'Teks alternatif foto',
  focus: 'Bagian Fokus',
  sectors: 'Bagian Sektor',
  fieldwork: 'Bagian Eksekusi lapangan',
  technology: 'Bagian Teknologi',
  steps: 'Langkah',
  engagementTitle: 'Judul bagian Model kerja sama',
  clientsTitle: 'Judul bagian Klien',
  story: 'Cerita perusahaan (per paragraf)',
  pillarsTitle: 'Judul bagian Nilai perusahaan',
  standardsTitle: 'Judul bagian Standar',
  culture: 'Budaya kerja',
  openRolesTitle: 'Judul daftar lowongan',
  emptyText: 'Teks saat tidak ada lowongan',
  serviceAreas: 'Area layanan',
  ctaLabel: 'Teks tombol ajakan',
  // pengaturan
  legalName: 'Nama badan hukum',
  brand: 'Merek',
  address: 'Alamat',
  email: 'Email',
  phone: 'Telepon',
  whatsapp: 'WhatsApp',
  hours: 'Jam operasional',
  // daftar
  deliverables: 'Hasil kerja',
  sector: 'Sektor',
  scope: 'Lingkup pekerjaan',
  location: 'Lokasi',
  highlights: 'Poin utama',
  department: 'Departemen',
  type: 'Jenis pekerjaan',
  experience: 'Pengalaman',
  responsibilities: 'Tanggung jawab',
  qualifications: 'Kualifikasi',
  benefits: 'Benefit',
  applicationEmail: 'Email untuk lamaran',
  postedAt: 'Tanggal tayang',
  validThrough: 'Berlaku sampai (opsional)',
  active: 'Tampilkan di situs',
};

/** Nama satu butir per berkas (untuk tombol "Tambah …" dan jalur yang mudah dibaca). */
export const ITEM_NOUN: Record<string, string> = {
  services: 'layanan',
  'property-types': 'sektor',
  pillars: 'nilai',
  fieldwork: 'kegiatan',
  engagement: 'model kerja sama',
  standards: 'standar',
  portfolio: 'proyek',
  clients: 'klien',
  insights: 'wawasan',
  careers: 'lowongan',
  steps: 'langkah',
  culture: 'poin budaya',
};

const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** `engagementTitle` → `Engagement title` untuk kunci yang belum ada di peta. */
export function humanizeKey(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key]!;
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').toLowerCase();
  return capitalize(words);
}

const pick = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Ringkasan satu butir: `title.id`, `name`, `slug`, atau `code`. */
export function itemSummary(item: unknown): string | null {
  if (!item || typeof item !== 'object') return pick(item);
  const o = item as Record<string, unknown>;
  const title = o.title as Record<string, unknown> | undefined;
  return pick(title?.id) ?? pick(title?.en) ?? pick(o.name) ?? pick((o.name as Record<string, unknown> | undefined)?.id) ?? pick(o.slug) ?? pick(o.code);
}

export function nounFor(arrayKey: string): string {
  return ITEM_NOUN[arrayKey] ?? 'butir';
}

const truncate = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Path yang mudah dibaca, mis. `[2].title.en` → `Lowongan 3 (Building Manager) › Judul › English (US)`.
 * `fileKey` dipakai untuk menamai butir di akar berkas berbentuk daftar; `data` untuk ringkasan butir.
 */
export function humanPath(path: string, fileKey: string, data?: unknown): string {
  const segs = parsePath(path);
  if (segs.length === 0) return 'Seluruh berkas';
  const parts: string[] = [];
  const seen: Segment[] = [];
  segs.forEach((s, i) => {
    const parentKey = i === 0 ? fileKey : String(segs[i - 1]);
    if (typeof s === 'number') {
      const prev = segs[i - 1];
      if (prev === 'id' || prev === 'en') {
        parts.push(`baris ${s + 1}`);
      } else {
        const summary = data === undefined ? null : itemSummary(getIn(data, [...seen, s]));
        parts.push(`${capitalize(nounFor(parentKey))} ${s + 1}${summary ? ` (${truncate(summary)})` : ''}`);
      }
    } else {
      parts.push(humanizeKey(s));
    }
    seen.push(s);
  });
  return parts.join(' › ');
}

/** Pilihan halaman tujuan tombol ajakan beranda. */
export const ROUTE_OPTIONS: { value: string; label: string }[] = [
  { value: 'services', label: 'Layanan' },
  { value: 'portfolio', label: 'Portofolio' },
  { value: 'research', label: 'Riset / Wawasan' },
  { value: 'about', label: 'Tentang kami' },
  { value: 'careers', label: 'Karier' },
  { value: 'contact', label: 'Kontak' },
];
