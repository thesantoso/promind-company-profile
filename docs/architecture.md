# Arsitektur

## Tujuan dan batasan

Situs company profile PROMIND dengan portal admin untuk tim non-teknis, performa dan SEO/GEO terbaik, dua bahasa (Indonesia dan English US) berkualitas native.

Batasan pemilik: hanya layanan Cloudflare gratis tanpa kartu pembayaran (R2 dicoret); email `promind.co.id` tetap di cPanel Rumahweb; portal PHP lama boleh diganti; fitur interaktif lama (Digital Twin, Console, ROI Calculator, Ticker) dibuang. Alasan lengkap ada di [decisions.md](decisions.md) dan spec.

## Arsitektur target

```
Editor ──► admin.promind.co.id (Worker + D1)            [tahap 3]
              │ draft di D1
              │ Publish
              ▼
        GitHub (repo privat) ──► GitHub Actions: build Astro + tes + Lighthouse
                                         │
                                         ▼
Pengunjung ──► promind.co.id (HTML statis di edge Cloudflare)   [tahap 4]

Email ──► Rumahweb (record MX tidak berubah)
Form kontak: Worker ──► endpoint PHP di Rumahweb ──► email cPanel   [tahap 3]
```

Yang sudah ada sekarang (tahap 1 dan 2) adalah kotak "HTML statis": situs Astro di `web/` yang membaca konten dari `web/content/*.json`. Admin akan menulis file JSON yang sama lewat GitHub API, jadi format konten di bawah adalah kontrak antara situs dan admin.

## Situs (`web/`)

- **Astro, output statis.** Tanpa JavaScript untuk navigasi, menu mobile memakai `<details>`. Satu-satunya script adalah `public/scripts/lang-redirect.js` (halaman pemilih bahasa `/`).
- **Tailwind CSS 4** dengan token desain di `src/styles/global.css` (`@theme`). Palet dan font mengikuti [AGENTS.md](../AGENTS.md).
- **Font self-hosted**, subset latin: Manrope (heading) dan DM Sans (body), keduanya di-preload.
- **Gambar** lewat `src/components/Photo.astro` (Astro Image, AVIF, crop 4:3 saat build). Foto sumber ada di `src/assets/photos/`.

### Routing dan bahasa

Setiap halaman ada dalam dua bahasa dengan slug yang diterjemahkan. Tabel route ada di `src/i18n/routes.ts` (satu-satunya sumber).

| Halaman | Indonesia | English |
|---|---|---|
| Beranda | `/id/` | `/en/` |
| Layanan / Services | `/id/layanan/` | `/en/services/` |
| Portofolio / Portfolio | `/id/portofolio/` | `/en/portfolio/` |
| Wawasan / Insights | `/id/riset/` | `/en/research/` |
| Tentang / About | `/id/tentang-kami/` | `/en/about/` |
| Karir / Careers | `/id/karir/` | `/en/careers/` |
| Detail lowongan | `/id/karir/<slug>/` | `/en/careers/<slug>/` |
| Kontak / Contact | `/id/kontak/` | `/en/contact/` |

- Trailing slash selalu ada. Prefix bahasa atau slug yang salah menghasilkan 404.
- `/` adalah pemilih bahasa `noindex`: dua tautan statis, plus redirect sekali berdasarkan `navigator.language` (tanpa cookie atau penyimpanan).
- Pengalih bahasa di header menuju halaman padanan (slug terjemahan), termasuk di halaman detail lowongan.
- `hreflang`: `id-ID`, `en-US`, dan `x-default` yang menunjuk ke halaman bahasa Indonesia. Canonical menunjuk ke halaman itu sendiri.

### Model konten

File ada di `web/content/`. Setiap teks punya `id` dan `en` berdampingan. Skema Zod ada di `src/content/schema.ts`, loader di `src/content/load.ts`. Data yang tidak valid **menggagalkan build**.

| File | Isi | Jumlah |
|---|---|---|
| `settings.json` | Nama legal, alamat, email, telepon, WhatsApp, jam | 1 objek |
| `pages.json` | Teks per halaman dan SEO (title, description) | 7 halaman |
| `services.json` | Layanan terpadu dan deliverables | 6 |
| `property-types.json` | Sektor properti | 6 |
| `pillars.json` | Nilai/pilar perusahaan | 5 |
| `fieldwork.json` | Eksekusi lapangan dengan foto dan alt text | 4 |
| `engagement.json` | Model kerja sama | 4 |
| `standards.json` | Standar dan sistem (ISO, SMK3, BMS) | 5 |
| `portfolio.json` | Proyek | 12 |
| `clients.json` | Klien | 14 |
| `insights.json` | Artikel wawasan | 4 |
| `careers.json` | Lowongan (lengkap dengan tanggung jawab, kualifikasi, benefit) | 5 |

Aturan yang ditegakkan oleh skema dan tes konten: kedua bahasa wajib terisi, daftar `id` dan `en` sama panjang, slug unik dan berformat `a-b-c`, tanggal hanya `YYYY-MM-DD`, tidak ada kunci `num` (badge nomor dilarang brand), penulisan `PROMIND`/`PROAPPS` selalu kapital, ejaan Inggris adalah US, dan "OHS" harus ditulis lengkap di teks English lowongan.

### Lowongan

Lowongan terbuka = `active: true` dan (`validThrough` kosong atau tanggalnya belum lewat). "Hari ini" adalah tanggal build dalam UTC (`src/lib/today.ts`). Daftar karir, route halaman detail, dan sitemap memakai definisi yang sama. Karena situs statis, lowongan yang kedaluwarsa baru hilang pada build berikutnya (lihat [roadmap](roadmap.md), butuh rebuild terjadwal).

### SEO dan GEO

- HTML lengkap sejak awal (bukan SPA), sitemap dengan `hreflang` dan URL lowongan, `robots.txt` yang mengizinkan crawler pencarian dan AI (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
- JSON-LD satu blok per halaman: `ProfessionalService` (semua halaman), `BreadcrumbList` (non-beranda), `Service` (halaman layanan), `JobPosting` (detail lowongan). `<` di-escape agar tag tidak bisa tertutup lebih awal.
- `llms.txt` berisi ringkasan situs dan daftar halaman dua bahasa. Efektivitasnya belum terbukti, diperlakukan sebagai pelengkap.
- Gambar OG: crop 1,91:1 dari foto lapangan, dibuat saat build.

### Keamanan

- Situs statis, hampir tanpa permukaan serangan. `public/_headers` memuat CSP ketat (`script-src 'self'`, tanpa `unsafe-inline`/`unsafe-eval`, `frame-ancestors 'none'`), HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, dan cache `immutable` untuk `/_astro/*`. File ini berlaku di Cloudflare (Workers static assets/Pages). `astro preview` mengabaikannya, jadi tes e2e menyuntikkan CSP aslinya dan gagal bila ada pelanggaran.
- JSON-LD adalah blok data, tidak perlu `unsafe-inline`.
- Admin (tahap 3) dirancang dengan 2FA TOTP, hash password kuat, cookie `HttpOnly`/`Secure`/`SameSite=Strict`, CSRF token, validasi Zod di server, dan token GitHub fine-grained untuk satu repo. Detail di spec bagian 7.

## Peta kode

```
web/src/
  i18n/       locales.ts (id/en), routes.ts (tabel route, pathFor, alternates, careerPath),
              ui.ts (teks UI dua bahasa), format.ts (tanggal, angka, IDR)
  content/    schema.ts (skema Zod), load.ts (loader tipe-aman), brand.ts (cek penulisan brand)
  lib/        seo.ts, sitemap.ts, jsonld.ts, job-paths.ts, today.ts, og.ts
  components/ Header, Footer, LangSwitch, SeoHead, Photo, Section, PageHero, BulletList,
              DefinitionRows, PlaceholderPage (tidak terpakai) dan pages/*Page.astro
  layouts/    BaseLayout.astro (head, JSON-LD, header, footer)
  pages/      index.astro (pemilih bahasa), [lang]/index.astro (beranda),
              [lang]/[...slug].astro (halaman lain + detail lowongan), 404, sitemap.xml, robots.txt, llms.txt
```
