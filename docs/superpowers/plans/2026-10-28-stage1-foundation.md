# PROMIND Revamp — Tahap 1: Fondasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fondasi situs baru: proyek Astro statis, token desain, font self-hosted, routing dan i18n dua bahasa, layout dengan SEO head, header/footer sesuai brand, sitemap/robots, header keamanan, serta pengujian dan CI dengan anggaran performa.

**Architecture:** Aplikasi Astro baru hidup di `web/` pada branch `revamp`, sementara situs Vite lama di root tetap utuh dan tetap ter-deploy dari `main` sampai cutover (tahap 4). Semua logika murni (route, i18n, SEO, skema, sitemap) berupa modul TypeScript kecil yang diuji Vitest. Halaman Astro hanya merakitnya. Halaman pada tahap ini berisi placeholder bermerek, isi sebenarnya masuk tahap 2.

**Tech Stack:** Astro (versi stabil terbaru; repo `promind-astro-emdash` memakai `^7.4.0`), Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript strict, Zod, Vitest, Playwright + `@axe-core/playwright`, Lighthouse CI, `@fontsource-variable/manrope`, `@fontsource-variable/dm-sans`. Node >= 22.

**Spec:** `docs/superpowers/specs/2026-10-28-promind-revamp-design.md`

## Global Constraints

- Hanya layanan gratis tanpa kartu. Tidak ada R2. Email tetap di Rumahweb.
- Header: putih solid `#ffffff`, tidak transparan, tidak blur, baik di atas maupun saat scroll.
- Palet: latar `#f6f5f1`, surface `#ffffff`, sub-surface `#eef2f4` / `#f9f8f5`, hairline `#d8dfe5` / `#cbd2d9`, heading `#172b42`, body `#526374` / `#586878`, aksen biru `#2b5caf` (hover `#194586`), navy `#183b68`.
- Font: Manrope (heading) dan DM Sans (body), di-host sendiri, woff2 variabel, tanpa Google Fonts. Line-height body 1.7–1.85.
- Penulisan brand: `PROMIND` dan `PROAPPS` selalu huruf kapital penuh.
- Daftar poin memakai bullet dot `•`, tanpa badge angka kotak. Satu CTA per section.
- Bahasa: `id` (default) dan `en` (ejaan en-US). Slug diterjemahkan. `hreflang`, `x-default`, canonical di setiap halaman.
- Anggaran: LCP < 1,5 dtk (mobile 4G), CLS < 0,05, INP < 150 ms, JS halaman biasa < 60 KB gzip, total halaman < 500 KB.
- Aksesibilitas: kontras cukup, fokus keyboard terlihat, `prefers-reduced-motion` dihormati, alt text bermakna.
- Tanpa JavaScript untuk navigasi mobile (CSS/`<details>`). Tidak ada script inline (CSP).
- Trailing slash selalu ada (`/id/layanan/`), `build.format: 'directory'`.

## Review Focus

1. Entri dengan bidang `en` kosong atau hanya spasi tidak boleh lolos publikasi (Task 4).
2. Prefix bahasa tidak dikenal atau slug salah (`/fr/…`, `/id/xyz/`) harus menghasilkan 404, bukan error (Task 3, 9).
3. Pengalih bahasa di halaman yang slug-nya beda per bahasa harus menuju slug terjemahan (mis. `/id/layanan/` → `/en/services/`), bukan slug yang sama (Task 3, 9).
4. Pengunjung tanpa JavaScript di `/` tetap mendapat tautan bahasa yang bisa diklik (Task 8).
5. Menu mobile berfungsi dengan keyboard tanpa JS, dan animasi dinonaktifkan saat `prefers-reduced-motion` (Task 7, 9).

## File Structure

```
web/
  astro.config.mjs            # site, trailingSlash, format, Tailwind vite plugin
  package.json  tsconfig.json  vitest.config.ts  playwright.config.ts  lighthouserc.json
  public/_headers  public/favicon.svg  public/images/promind-header-brand.png
  src/
    styles/global.css         # @import tailwindcss, fontsource, @theme tokens
    i18n/locales.ts           # LOCALES, Locale, DEFAULT_LOCALE, isLocale, htmlLang
    i18n/routes.ts            # ROUTES table, pathFor, resolveRoute, alternates
    i18n/ui.ts                # UI strings per locale
    i18n/format.ts            # formatDate, formatNumber, formatIDR
    content/schema.ts         # bilingual schemas, siteSettings, assertPublishable
    data/settings.json        # alamat, email, telepon (dari situs lama)
    lib/seo.ts                # buildSeo
    lib/sitemap.ts            # buildSitemap, buildRobots
    layouts/BaseLayout.astro  # <html>, head, header, footer, slot
    components/SeoHead.astro  Header.astro  Footer.astro  LangSwitch.astro
    pages/index.astro                 # root: pilih bahasa
    pages/[lang]/index.astro          # beranda placeholder
    pages/[lang]/[...slug].astro      # halaman lain placeholder
    pages/404.astro  sitemap.xml.ts  robots.txt.ts
    scripts/lang-redirect.js          # satu kali, eksternal
  tests/e2e/smoke.spec.ts
.github/workflows/web-ci.yml
```

---

### Task 1: Scaffold proyek `web/` di branch `revamp`

**Files:**
- Create: `web/package.json`, `web/astro.config.mjs`, `web/tsconfig.json`, `web/vitest.config.ts`, `web/src/pages/index.astro` (sementara), `web/.node-version` (`22`)
- Test: `web/src/smoke.test.ts`

**Interfaces:**
- Produces: perintah `npm run dev|build|test` di `web/`; `site` diambil dari `process.env.SITE_URL ?? 'https://promind.co.id'`.

- [ ] **Step 1:** Dari `main`, buat branch `revamp`. Working tree punya perubahan lama (`deploy.yml`, `.htaccess`, `portal/*`, `HANDOVER.md`): jangan di-commit atau dibuang tanpa persetujuan pemilik. Bawa saja ke branch (`git switch -c revamp`) dan commit hanya file milik task ini dengan `git add` per path.
- [ ] **Step 2:** Buat `web/` dengan Astro, Tailwind 4 (`@tailwindcss/vite`), TypeScript `strict`, Zod, Vitest. Gunakan dokumentasi resmi versi terbaru (context7) untuk setup, jangan menyalin dari repo `promind-astro-emdash`. `astro.config.mjs`: `output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `build.inlineStylesheets: 'never'`.
- [ ] **Step 3: Write the failing test** `src/smoke.test.ts`: `expect(1 + 1).toBe(2)` hanya untuk membuktikan runner jalan. Run: `cd web && npx vitest run` → Expected: PASS (runner terkonfigurasi). Lalu `npm run build` → Expected: sukses, `dist/index.html` ada.
- [ ] **Step 4: Commit** `chore(web): scaffold Astro static app`. Hapus `smoke.test.ts` begitu Task 3 punya tes nyata.

### Task 2: Token desain dan font self-hosted

**Files:**
- Create: `web/src/styles/global.css`
- Test: `web/src/styles/tokens.test.ts`

**Interfaces:**
- Produces: variabel CSS `--color-bg`, `--color-surface`, `--color-subsurface`, `--color-hairline`, `--color-heading`, `--color-body`, `--color-accent`, `--color-accent-hover`, `--color-navy`; `--font-display` (Manrope), `--font-body` (DM Sans). Kelas dasar: `body` memakai `--color-bg`, `--font-body`, line-height 1.75.

- [ ] **Step 1: Write the failing test** `tokens.test.ts` membaca `global.css` dan menegaskan: `--color-surface` bernilai `#ffffff`, `--color-bg` `#f6f5f1`, `--color-heading` `#172b42`, `--color-body` `#526374`, `--color-accent` `#2b5caf`, `--color-accent-hover` `#194586`, `--color-navy` `#183b68`; tidak ada string `fonts.googleapis.com`; ada `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 2:** Run `npx vitest run src/styles/tokens.test.ts` → FAIL (file belum ada).
- [ ] **Step 3:** Tulis `global.css`: `@import "tailwindcss"`, `@import "@fontsource-variable/manrope"`, `@import "@fontsource-variable/dm-sans"`, blok `@theme` berisi token di atas, aturan reduced-motion yang mematikan animasi/transisi. Gunakan subset latin saja bila paket menyediakannya.
- [ ] **Step 4:** Run tes → PASS. `npm run build` → sukses.
- [ ] **Step 5: Commit** `feat(web): design tokens and self-hosted fonts`.

### Task 3: Inti i18n dan tabel route

**Files:**
- Create: `web/src/i18n/locales.ts`, `web/src/i18n/routes.ts`
- Test: `web/src/i18n/routes.test.ts`

**Interfaces:**
- Produces (`locales.ts`): `LOCALES = ['id','en'] as const`; `type Locale`; `DEFAULT_LOCALE: Locale = 'id'`; `isLocale(v: string): v is Locale`; `htmlLang(l: Locale): 'id-ID' | 'en-US'`.
- Produces (`routes.ts`): `type RouteKey = 'home'|'services'|'portfolio'|'research'|'about'|'careers'|'contact'`; `ROUTES: Record<RouteKey, Record<Locale, string>>` (slug tanpa slash; home = `''`); `pathFor(key: RouteKey, lang: Locale): string`; `resolveRoute(lang: string, slug: string | undefined): RouteKey | null`; `alternates(key: RouteKey, siteUrl: string): { hreflang: string; href: string }[]` berisi `id-ID`, `en-US` (URL absolut) dan `x-default` yang menunjuk `${siteUrl}/`.
- Slug: id → `''`, `layanan`, `portofolio`, `riset`, `tentang-kami`, `karir`, `kontak`; en → `''`, `services`, `portfolio`, `research`, `about`, `careers`, `contact`.

- [ ] **Step 1: Write the failing tests** (`routes.test.ts`):
  - `pathFor('services','id') === '/id/layanan/'`, `pathFor('services','en') === '/en/services/'`, `pathFor('home','en') === '/en/'`.
  - `resolveRoute('id','layanan') === 'services'`; `resolveRoute('en','layanan') === null` (slug bahasa lain ditolak); `resolveRoute('fr','services') === null`; `resolveRoute('id', undefined) === 'home'`.
  - `alternates('about','https://promind.co.id')` memuat `{hreflang:'id-ID',href:'https://promind.co.id/id/tentang-kami/'}`, `{hreflang:'en-US',href:'https://promind.co.id/en/about/'}`, dan `x-default` ke `https://promind.co.id/`.
  - Semua `RouteKey` punya slug unik per bahasa (tidak ada dua key dengan slug sama).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementasikan kedua modul. Hapus `smoke.test.ts`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(web): locale and translated route table`.

### Task 4: Skema konten bilingual dan gate publikasi

**Files:**
- Create: `web/src/content/schema.ts`, `web/src/data/settings.json`
- Test: `web/src/content/schema.test.ts`

**Interfaces:**
- Produces: `bilingualText: z.ZodObject<{id: ZodString; en: ZodString}>` (kedua bahasa `trim().min(1)`); `bilingualImage` = `{ src: string (min 1); alt: bilingualText }`; `siteSettingsSchema` = `{ legalName: string; brand: 'PROMIND'; address: bilingualText; email: string email; phone: string; whatsapp: string; hours: bilingualText }`; `type SiteSettings`; `loadSettings(): SiteSettings` (parse `settings.json`, lempar error bila tidak valid).
- Data `settings.json` diambil dari `public/api/site-content.json` (bagian `companyInfo`). Nomor WhatsApp di sana tampak placeholder (`+62 811 1234 5678`) dan bertentangan dengan `emergencyContact`: tandai dan minta pemilik mengonfirmasi sebelum tahap 2. Alamat English ditulis native (ejaan en-US).

- [ ] **Step 1: Write the failing tests:**
  - `bilingualText.safeParse({id:'Halo', en:'   '}).success === false` dan `{id:'', en:'Hi'}` juga gagal.
  - `bilingualImage.safeParse({src:'/a.jpg', alt:{id:'Gedung', en:''}}).success === false`.
  - `siteSettingsSchema.safeParse({...valid, brand:'Promind'}).success === false` (brand wajib `PROMIND`).
  - `loadSettings()` mengembalikan objek valid dari `settings.json`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementasikan skema dan `loadSettings`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(web): bilingual content schemas and site settings`.

### Task 5: String UI dan util format

**Files:**
- Create: `web/src/i18n/ui.ts`, `web/src/i18n/format.ts`
- Test: `web/src/i18n/ui.test.ts`, `web/src/i18n/format.test.ts`

**Interfaces:**
- Produces: `type UiKey = 'nav.home'|'nav.services'|'nav.portfolio'|'nav.research'|'nav.about'|'nav.careers'|'nav.contact'|'nav.menu'|'nav.skip'|'lang.switch'|'lang.choose'|'footer.rights'|'placeholder.soon'`; `UI: Record<Locale, Record<UiKey, string>>`; `t(lang: Locale, key: UiKey): string`; `formatDate(d: Date | string, lang: Locale): string`; `formatNumber(n: number, lang: Locale): string`; `formatIDR(n: number, lang: Locale): string`.
- English ditulis native (mis. `nav.about` = "About", bukan terjemahan kaku dari "Tentang Kami").

- [ ] **Step 1: Write the failing tests:**
  - Kedua locale punya himpunan key identik, tidak ada nilai kosong, dan tidak ada nilai `en` yang sama persis dengan `id` kecuali brand.
  - `formatDate('2026-10-28','id') === '28 Oktober 2026'`; `formatDate('2026-10-28','en') === 'October 28, 2026'`.
  - `formatNumber(1500000,'id') === '1.500.000'`; `'en'` → `'1,500,000'`.
  - `formatIDR(1500000,'id')` mengandung `Rp` dan `1.500.000`; `'en'` mengandung `IDR` dan `1,500,000` (normalisasi whitespace/nbsp sebelum membandingkan, tanpa desimal).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementasikan dengan `Intl.DateTimeFormat`/`Intl.NumberFormat` (`id-ID`, `en-US`); `timeZone: 'UTC'` untuk tanggal agar deterministik.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(web): UI strings and locale formatters`.

### Task 6: Builder SEO, sitemap, robots

**Files:**
- Create: `web/src/lib/seo.ts`, `web/src/lib/sitemap.ts`, `web/src/pages/sitemap.xml.ts`, `web/src/pages/robots.txt.ts`
- Test: `web/src/lib/seo.test.ts`, `web/src/lib/sitemap.test.ts`

**Interfaces:**
- Consumes: `alternates`, `pathFor`, `RouteKey`, `Locale`, `htmlLang` (Task 3).
- Produces: `buildSeo(i: { lang: Locale; routeKey: RouteKey; title: string; description: string; siteUrl: string; ogImage?: string }): { title: string; description: string; canonical: string; alternates: {hreflang: string; href: string}[]; og: { title: string; description: string; url: string; image: string; locale: 'id_ID' | 'en_US'; type: 'website' } }`; `buildSitemap(siteUrl: string): string` (XML, satu `<url>` per RouteKey × bahasa, masing-masing dengan `xhtml:link` alternates); `buildRobots(siteUrl: string): string`.
- `og.image` default `${siteUrl}/images/promind-header-brand.png`.

- [ ] **Step 1: Write the failing tests:**
  - `buildSeo` untuk `about`/`en`: `canonical === 'https://promind.co.id/en/about/'`; `alternates` memuat `x-default`; `og.locale === 'en_US'`; canonical selalu berakhir `/`.
  - `buildSitemap` memuat tepat 14 `<loc>` (7 route × 2 bahasa), setiap `<url>` punya tiga `xhtml:link` (id-ID, en-US, x-default), dan tidak memuat `/404`.
  - `buildRobots` memuat `Sitemap: https://promind.co.id/sitemap.xml`, mengizinkan `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` (Allow `/`), dan tidak memblokir `/`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementasikan modul dan dua endpoint Astro yang memanggilnya dengan `import.meta.env.SITE`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(web): SEO builder, sitemap, robots`.

### Task 7: Layout, header, footer, pengalih bahasa

**Files:**
- Create: `web/src/layouts/BaseLayout.astro`, `web/src/components/SeoHead.astro`, `Header.astro`, `Footer.astro`, `LangSwitch.astro`; salin `promind-header-brand.png` dan `favicon.svg` dari `public/` lama ke `web/public/`.

**Interfaces:**
- Consumes: `buildSeo`, `pathFor`, `alternates`, `t`, `htmlLang`, `loadSettings`.
- Produces: `BaseLayout` dengan props `{ lang: Locale; routeKey: RouteKey; title: string; description: string }` dan `<slot />`. `LangSwitch` menerima `{ lang: Locale; routeKey: RouteKey }` dan menautkan ke `pathFor(routeKey, otherLang)` (slug terjemahan).

- [ ] **Step 1:** `BaseLayout`: `<html lang={htmlLang(lang)}>`, `SeoHead` (title, description, canonical, semua alternates, OG, favicon, `theme-color` `#ffffff`), tautan "skip to content" (`t(lang,'nav.skip')`), `Header`, `<main id="main">`, `Footer`.
- [ ] **Step 2:** `Header`: latar `#ffffff` solid, border bawah hairline `#d8dfe5`, `position: sticky`, tanpa `backdrop-filter`/opacity. Logo `promind-header-brand.png` dengan `alt="PROMIND"`. Navigasi tujuh route lewat `pathFor`, penanda `aria-current="page"` pada route aktif. Menu mobile memakai `<details>`/`<summary>` (tanpa JS) dengan fokus terlihat. `LangSwitch` memakai `<a hreflang lang>` dan `aria-label` bahasa lawan.
- [ ] **Step 3:** `Footer`: nama legal, alamat, email, telepon dari `loadSettings()` sesuai bahasa, tautan route, `t(lang,'footer.rights')`. Tanpa CTA ganda.
- [ ] **Step 4:** `npm run build` → sukses. Verifikasi perilaku (header solid, menu tanpa JS, fokus) ditangkap Playwright di Task 9, bukan di sini.
- [ ] **Step 5: Commit** `feat(web): base layout, header, footer, language switch`.

### Task 8: Halaman, root, dan 404

**Files:**
- Create: `web/src/pages/[lang]/index.astro`, `web/src/pages/[lang]/[...slug].astro`, `web/src/pages/index.astro` (ganti sementara), `web/src/pages/404.astro`, `web/src/scripts/lang-redirect.js`
- Test: `web/src/pages/routes-coverage.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `ROUTES`, `pathFor`, `BaseLayout`.
- `getStaticPaths` di `[...slug].astro` mengembalikan hanya kombinasi valid `{lang, slug}` dari `ROUTES` (kecuali `home`), jadi slug/bahasa lain jatuh ke `404.astro`.

- [ ] **Step 1: Write the failing test** `routes-coverage.test.ts`: untuk setiap `RouteKey` × `Locale`, `pathFor` menghasilkan path yang berkorespondensi dengan satu file `dist/` setelah build (jalankan `npm run build` lebih dulu di tes via `child_process`, atau baca `dist/<path>/index.html`). Tambahan: `dist/id/xyz/index.html` dan `dist/fr/index.html` tidak ada; `dist/404.html` ada.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Halaman placeholder memakai `BaseLayout`: `<h1>` judul route sesuai bahasa, satu paragraf `t(lang,'placeholder.soon')`. Beranda `/<lang>/` serupa. `index.astro` di root: halaman dua tautan besar ke `/id/` dan `/en/` (`<a>` bertulis "Bahasa Indonesia" / "English"), `<link rel="canonical">` ke `/`, dan `<script src="/scripts/lang-redirect.js">` eksternal: bila `localStorage` belum punya pilihan dan `navigator.language` diawali `en`, arahkan ke `/en/`, selain itu ke `/id/`, lalu simpan pilihan agar hanya terjadi sekali. Tanpa JS, dua tautan tetap bisa diklik.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(web): bilingual placeholder pages, root, and 404`.

### Task 9: Header keamanan dan uji end-to-end

**Files:**
- Create: `web/public/_headers`, `web/playwright.config.ts`, `web/tests/e2e/smoke.spec.ts`, `web/tests/headers.test.ts`

**Interfaces:**
- `_headers` untuk `/*`: `Content-Security-Policy` (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Aset `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`.

- [ ] **Step 1: Write the failing tests:**
  - `headers.test.ts` (Vitest): `_headers` memuat semua header di atas dan CSP tidak mengandung `unsafe-inline` atau `unsafe-eval`.
  - `smoke.spec.ts` (Playwright, jalan terhadap `astro preview`), untuk `id` dan `en`:
    - Setiap route 200 dan `<html lang>` sesuai (`id-ID`/`en-US`), ada satu `<h1>`, ada `link[rel=canonical]` dan tiga `link[rel=alternate][hreflang]`.
    - `/fr/` dan `/id/xyz/` menghasilkan 404.
    - Pengalih bahasa di `/id/layanan/` menuju `/en/services/` (bukan `/en/layanan/`).
    - Header: `getComputedStyle(header).backgroundColor === 'rgb(255, 255, 255)'`, `backdropFilter` bernilai `none`, tetap sama setelah scroll 600 px.
    - Menu mobile (viewport 375 px) bisa dibuka dengan keyboard (`Enter` pada `summary`) dan fokus terlihat (outline tidak `none`).
    - Dengan `prefers-reduced-motion: reduce`, durasi transisi/animasi elemen utama `0s`.
    - `@axe-core/playwright` tanpa pelanggaran `serious`/`critical` di semua route kedua bahasa.
    - `/` dengan JavaScript dimatikan masih memuat tautan `/id/` dan `/en/` yang terlihat.
    - Tidak ada permintaan jaringan ke `fonts.googleapis.com` atau `fonts.gstatic.com`.
- [ ] **Step 2:** Run `npx vitest run tests/headers.test.ts` dan `npx playwright test` → FAIL.
- [ ] **Step 3:** Buat `_headers` dan konfigurasi Playwright (`webServer: npm run build && npm run preview`, proyek desktop dan mobile). Perbaiki apa pun yang ditemukan tes di Task 7/8. CSP harus tidak diblokir oleh output Astro: bila build memasukkan script/style inline, ubah konfigurasi agar eksternal, bukan melonggarkan CSP.
- [ ] **Step 4:** Run kedua perintah → PASS.
- [ ] **Step 5: Commit** `test(web): security headers and e2e smoke with a11y`.

### Task 10: CI dan anggaran performa

**Files:**
- Create: `.github/workflows/web-ci.yml`, `web/lighthouserc.json`

**Interfaces:**
- Workflow jalan pada push dan PR yang mengubah `web/**`, langkah: `npm ci`, `npm run build`, `npx vitest run`, `npx playwright test`, `npx lhci autorun`. Tidak ada deploy dan tidak ada secret pada tahap ini. Workflow `deploy.yml` lama pada `main` tidak disentuh.
- `lighthouserc.json`: uji `/id/` dan `/en/` pada preset mobile; asersi `largest-contentful-paint` ≤ 1500, `cumulative-layout-shift` ≤ 0,05, `total-byte-weight` ≤ 512000, kategori `performance`, `accessibility`, `seo`, `best-practices` skor minimal 0,95 (error, bukan warn). Catatan: INP tidak bisa diukur Lighthouse, jadi ditinjau lewat uji interaksi tahap berikutnya.

- [ ] **Step 1:** Tulis kedua file.
- [ ] **Step 2:** Jalankan lokal: `cd web && npm run build && npx lhci autorun` → Expected: semua asersi lulus pada halaman placeholder. Bila gagal, perbaiki penyebabnya (gambar, font, CSS), jangan menurunkan ambang.
- [ ] **Step 3:** Push branch `revamp` hanya bila pemilik meminta. Bila tidak, catat bahwa CI belum dijalankan di GitHub.
- [ ] **Step 4: Commit** `ci(web): build, tests, and Lighthouse budgets`.

---

## Self-review

- **Cakupan spec (bagian tahap 1):** token dan font (T2), i18n dan slug terjemahan (T3, T5), gate bilingual dan alt text (T4), hreflang/canonical/sitemap/robots (T6), header solid dan layout (T7), root dan 404 (T8), header keamanan dan aksesibilitas (T9), anggaran performa di CI (T10). Spec bagian 6 (JSON-LD, `llms.txt`, IndexNow), 3 (koleksi konten sebenarnya), 4 (admin), dan 8 (migrasi, redirect) sengaja menjadi tahap 2–4.
- **Konsistensi tipe:** `Locale`, `RouteKey`, `pathFor`, `alternates`, `buildSeo`, `loadSettings` didefinisikan di Task 3, 4, 6 dan dipakai di Task 7–8 dengan nama yang sama.
- **Pertanyaan terbuka untuk pemilik:** (1) nomor WhatsApp yang benar (Task 4); (2) setuju mendorong branch `revamp` ke GitHub untuk menjalankan CI (Task 10).
- **Prasyarat di luar kode:** ganti password admin lama `Promind2026!` dan hapus dari `HANDOVER.md`. Verifikasi layanan Cloudflare tanpa kartu dikerjakan di awal tahap 3 dan 4, tidak menghalangi tahap 1 yang sepenuhnya lokal.
