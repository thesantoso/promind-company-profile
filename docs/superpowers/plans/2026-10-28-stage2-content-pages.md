# PROMIND Revamp — Tahap 2: Konten dan Halaman Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, owner chose to run all plans). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memigrasikan semua konten situs lama ke koleksi JSON bertipe dua bahasa dan membangun 7 halaman nyata (plus detail lowongan) dengan JSON-LD, `llms.txt`, dan gambar OG.

**Architecture:** Konten berupa file JSON di `web/content/` (nanti ditulis oleh admin tahap 3 lewat GitHub API). Setiap file divalidasi Zod oleh loader tipe-aman di `web/src/content/` saat build, sehingga data rusak menggagalkan build. Halaman Astro merakit loader + komponen `Section`/`PageHero`/`Photo`. Gaya editorial: hairline, tanpa kartu melayang, tanpa badge nomor.

**Tech Stack:** Seperti tahap 1 (Astro statis, Tailwind 4, Zod, Vitest, Playwright, Lighthouse CI).

**Spec:** `docs/superpowers/specs/2026-10-28-promind-revamp-design.md` (bagian 3, 5, 6, 8, 10). Tahap 1: `docs/superpowers/plans/2026-10-28-stage1-foundation.md`.

## Global Constraints

- Semua batasan tahap 1 tetap berlaku (palet, font, header putih solid, `PROMIND`/`PROAPPS` kapital, bullet `•`, satu CTA per section, trailing slash, CSP tanpa `unsafe-inline`, anggaran performa, Lighthouse ≥ 0,95).
- Setiap bidang teks punya `id` dan `en` (en-US, ditulis native, bukan terjemahan harfiah). Tidak ada bidang `num` atau badge nomor `01`–`05`.
- Tanggal konten berformat tanggal saja `YYYY-MM-DD` (keputusan dari review tahap 1).
- Tidak ada klaim baru yang dikarang. Data yang meragukan dimigrasi apa adanya, diberi catatan `needsReview` di `web/content/REVIEW.md`, dan dilaporkan ke pemilik.
- Slug entri sama untuk kedua bahasa (mis. `/id/karir/building-manager/`, `/en/careers/building-manager/`). Slug route statis tetap dari `ROUTES`.
- Form kontak ditunda ke tahap 3 (butuh endpoint, Turnstile, dan pembaruan CSP). Halaman kontak tahap ini hanya menampilkan data kontak dan tautan `mailto:`/`tel:`.

## Review Focus

1. Entri dengan satu bahasa kosong atau daftar `id`/`en` beda panjang tidak boleh lolos build (Task 1).
2. Lowongan duplikat (`hse-officer` dua kali di data lama) atau slug ganda harus gagal build, bukan menimpa diam-diam (Task 1, 4).
3. Teks `Promind`/`ProMind` (selain email dan URL) tidak boleh masuk konten (Task 1).
4. Lowongan nonaktif atau lewat `validThrough` tidak muncul di daftar, sitemap, maupun JSON-LD, dan URL-nya tidak dibuat (Task 10).
5. Pengalih bahasa di halaman detail lowongan dan di halaman dinamis lain harus menuju halaman lawan yang sama, bukan beranda (Task 10).

## File Structure

```
web/content/                  settings.json services.json property-types.json pillars.json fieldwork.json
                              engagement.json standards.json portfolio.json clients.json insights.json
                              careers.json pages.json REVIEW.md
web/src/content/schema.ts     (extend) blList, collection schemas
web/src/content/load.ts       typed loaders: loadServices() ... loadPages()
web/src/content/content.test.ts   gate over every JSON file
web/src/assets/photos/        hero + 4 fieldwork photos (moved from public/)
web/src/components/           Section PageHero Photo BulletList JsonLd
web/src/pages/[lang]/         index (home), [...slug] (static + career detail)
web/src/lib/jsonld.ts         builders; web/src/pages/llms.txt.ts
```

---

### Task 1: Content foundation and gate

**Files:** Modify `web/src/content/schema.ts`; Create `web/src/content/load.ts`, `web/content/` (move `src/data/settings.json` to `web/content/settings.json`), `web/src/content/content.test.ts`.

**Interfaces:**
- Produces (`schema.ts`): `blList` = `{ id: string[]; en: string[] }` (each item trimmed non-empty, min 1, `id.length === en.length` via refine); `slug` = `/^[a-z0-9]+(-[a-z0-9]+)*$/`; `dateOnly` = `/^\d{4}-\d{2}-\d{2}$/`; schemas `serviceSchema {slug,title,summary: bilingualText, deliverables: blList}`, `propertyTypeSchema {slug,title,summary,detail}`, `pillarSchema {slug,title,summary}`, `fieldworkSchema {slug,title,summary, image: bilingualImage}`, `engagementSchema {slug,title,summary}`, `standardSchema {code: string, name: bilingualText}`, `portfolioSchema {name: string, sector: bilingualText, scope: bilingualText, location: bilingualText}`, `clientSchema {name: string, category: bilingualText}`, `insightSchema {slug,category,title,summary: bilingualText, highlights: blList}`, `jobSchema {slug,title,department,type,experience,location,summary: bilingualText, responsibilities,qualifications,benefits: blList, applicationEmail: email, postedAt: dateOnly, validThrough?: dateOnly, active: boolean}`; `pagesSchema` (per-page copy, defined in Task 5).
- Produces (`load.ts`): `loadServices(): Service[]`, `loadPropertyTypes()`, `loadPillars()`, `loadFieldwork()`, `loadEngagement()`, `loadStandards()`, `loadPortfolio()`, `loadClients()`, `loadInsights()`, `loadJobs(): Job[]` (all, throws on duplicate slug), `loadActiveJobs(today: string): Job[]` (active and `validThrough` empty or `>= today`), `loadPages(): Pages`. Each parses its JSON with the schema and, for slugged collections, throws `Error('duplicate slug: <slug>')`.

- [ ] **Step 1: Write failing tests** (`content.test.ts` plus additions to `schema.test.ts`):
  - `blList` rejects `{id:['a'], en:[]}`, `{id:['a','b'], en:['a']}`, and an item `'  '`.
  - `loadJobs` with an injected array containing two `hse-officer` throws `duplicate slug: hse-officer` (loader exposes `assertUniqueSlugs(items)` used by test).
  - `loadActiveJobs('2026-10-28')` excludes `active:false` and `validThrough:'2026-10-01'`, includes `validThrough:'2026-12-31'` and missing `validThrough` (fixture arrays).
  - Gate: for every `*.json` in `web/content/` (except settings, pages, covered by their own loader) the matching loader runs without throwing; no JSON contains a key `num`; no string value matches `/\bpromind\b/i` unless it is exactly `PROMIND` or part of an email, URL, or hostname (`@promind`, `promind.co.id`); no value matches `/\bproapps\b/i` unless exactly `PROAPPS`.
- [ ] **Step 2:** Run `npx vitest run src/content` → FAIL.
- [ ] **Step 3:** Implement schemas and loaders. Move `settings.json`, update `loadSettings` import path. Loaders import the JSON statically (`resolveJsonModule`).
- [ ] **Step 4:** Run → PASS; `npm run build` passes (no data yet beyond settings; loaders for empty collections are not called until used).
- [ ] **Step 5: Commit** `feat(web): content schemas, loaders, and content gate`.

### Task 2: Migrate company-wide content

**Files:** Create `web/content/services.json`, `property-types.json`, `pillars.json`, `fieldwork.json`, `engagement.json`, `standards.json`, `web/content/REVIEW.md`.

- [ ] **Step 1:** Write a throwaway Node script in the scratchpad (not committed) that reads `../promind-company-profile/src/data/promindContent.js` and emits the JSON files: services from `servicesPage.pillars` (slug from English title, e.g. `property-preliminary-management`), property types from `home.sectors.items`, pillars from `home.intro.pillars`, fieldwork from `home.fieldwork.items` (image `{src:'/photos/<file>', alt:{id,en}}` with alt text written from the title), engagement from `servicesPage.engagementModels`, standards from `meta.standards`. Drop every `num`/`code` badge field. Deliverables lists must keep id and en aligned item by item.
- [ ] **Step 2:** Review the English of each entry and rewrite stiff phrasing to natural en-US without changing facts (e.g. "Hand Over Unit to Customer" stays as a deliverable name). Indonesian text stays verbatim.
- [ ] **Step 3:** Write `REVIEW.md` listing items the owner must verify: standards `ISO 9001 : 2026` and `ISO 14001 : 2026` (years look wrong, real revisions are 2015), unverified claims ("didirikan 2013"), and email domain (`promind.id` in old content vs `promind.co.id`); all migrated emails use `promind.co.id`.
- [ ] **Step 4:** Run the Task 1 gate → PASS. `loadServices().length === 6`, `loadPropertyTypes().length === 6`, `loadPillars().length === 5`, `loadFieldwork().length === 4`, `loadEngagement().length === 4`, `loadStandards().length === 5` (add these as tests in `content.test.ts` first, watch them fail, then generate data).
- [ ] **Step 5: Commit** `feat(web): migrate services, sectors, pillars, fieldwork, standards`.

### Task 3: Migrate portfolio, clients, insights

**Files:** Create `web/content/portfolio.json`, `clients.json`, `insights.json`.

- [ ] **Step 1: Tests first** (counts): portfolio 12, clients 14, insights 4; every portfolio `sector.en` is one of `Apartment`, `Office Building`, `Retail & Commercial`, `Commercial`, `Real Estate`, `Residence`, `Corporate Facility`, `Property` (read the actual set from the data and assert the set equals what was migrated, so a typo fails).
- [ ] **Step 2:** Migrate from `public/api/site-content.json` (`portfolio`, `clients`) and `promindContent.js` (`researchPage.reports`, id and en). Portfolio `scope` and `location` exist only in Indonesian: write natural en-US for all 12. Clients: `[name, category]` pairs, category gets bilingual labels. Insight slugs from English titles.
- [ ] **Step 3:** Run tests and gate → PASS. **Step 4: Commit** `feat(web): migrate portfolio, clients, insights`.

### Task 4: Migrate careers

**Files:** Create `web/content/careers.json`.

- [ ] **Step 1: Tests first:** `loadJobs()` has 5 entries (the duplicate `hse-officer (Copy)` is dropped); slugs are `building-manager`, `chief-engineer`, `tenant-relations-officer`, `finance-supervisor`, `hse-officer`; every `applicationEmail` ends with `@promind.co.id`; every job has ≥ 3 items in each of responsibilities, qualifications, benefits; every `postedAt` is `dateOnly`.
- [ ] **Step 2:** Migrate from `site-content.json` `careers` (Indonesian lists) and `promindContent.js` `careersPage.jobs` (English title/dept/type/desc). Write native en-US for responsibilities, qualifications, benefits. `postedAt` from `published_at` date part; `active: true`; omit `validThrough`. Normalize `type` to bilingual (`Full-Time`/`Full-time`). Add the migration note to `REVIEW.md` (recruitment email domain).
- [ ] **Step 3:** Run tests → PASS. **Step 4: Commit** `feat(web): migrate careers`.

### Task 5: Page copy

**Files:** Create `web/content/pages.json`; Modify `schema.ts` (`pagesSchema`), `load.ts`.

**Interfaces:** `Pages` = `{ home: { hero: {eyebrow, title, description, cta: {label, route: RouteKey}}, focus: {eyebrow,title,body}, sectors: {eyebrow,title,subtitle}, fieldwork: {eyebrow,title,subtitle}, technology: {eyebrow,title,description, steps: {title,summary}[]}, supporting: {label,text} }, services: {eyebrow,title,subtitle}, portfolio: {eyebrow,title,subtitle}, insights: {eyebrow,title,subtitle}, about: {eyebrow,title,story: bilingual paragraphs (blList)}, careers: {eyebrow,title,subtitle, culture: {title,summary}[]}, contact: {eyebrow,title,subtitle, serviceAreas: blList} }` plus per-page `seo: {title, description}` bilingual. Each page has exactly one CTA (`route`), never two.

- [ ] **Step 1: Tests first:** `loadPages()` parses; every page's `seo.title.en` ends with `| PROMIND` or starts with `PROMIND |`; `seo.description` lengths between 70 and 170 characters in both languages; `home.hero.cta.route` is a valid `RouteKey`.
- [ ] **Step 2:** Migrate copy from `promindContent.js` (id and en), removing numbering and the duplicate CTA (`ctaPrimary` and `ctaSecondary` collapse to one). Write the SEO titles/descriptions (answer-first, factual, no unsupported claims).
- [ ] **Step 3:** Run → PASS. **Step 4: Commit** `feat(web): migrate page copy and SEO text`.

### Task 6: Photos and layout primitives

**Files:** Create `web/src/assets/photos/` (`hero.jpg` from `main-hero.jpeg`, `building-operations.jpg`, `engineering.jpg`, `hse.jpg`, `tenant-relations.jpg` from the `-v2` files), `web/src/components/Photo.astro`, `Section.astro`, `PageHero.astro`, `BulletList.astro`; Modify `seo.ts`, `BaseLayout.astro`.

**Interfaces:** `Photo` props `{ src: ImageMetadata; alt: string; sizes: string; priority?: boolean; widths?: number[] }` renders Astro `<Image>` with `format="avif"`, `widths`, `sizes`, `loading` eager and `fetchpriority="high"` only when `priority`. `Section` props `{ eyebrow?: string; title: string; subtitle?: string; id?: string }` with `<slot />`. `BulletList` props `{ items: string[] }` renders `<ul>` with a visible `•` marker, never numbers. `getOgImage(): Promise<string>` returns the URL of the hero cropped to 1200×630 (`getImage`, jpg, cover).

- [ ] **Step 1: Tests first** (e2e in `smoke.spec.ts`): every page's `meta[property="og:image"]` ends with `.jpg` and fetching it returns 200 with dimensions 1200×630 (check via `createImageBitmap` or response size header > 0 plus Playwright `request`); `twitter:card` equals `summary_large_image`.
- [ ] **Step 2:** Move photos (copy from old `public/images`, keep only used files), implement components, wire OG default into `BaseLayout` via `getOgImage`. Remove duplicated `public/images/promind-header-brand.png` only if nothing else references it (OG no longer uses it).
- [ ] **Step 3:** Run e2e and `npm run build` → PASS. **Step 4: Commit** `feat(web): photos, layout primitives, 1200x630 OG image`.

### Task 7: Home page

**Files:** Modify `web/src/pages/[lang]/index.astro`; Delete `PlaceholderPage.astro` usage for home.

- [ ] **Step 1: Tests first** (e2e, both languages): one `<h1>` equal to `pages.home.hero.title[lang]`; hero image has `fetchpriority="high"` and is the only eager image besides the logo; exactly one primary CTA link in `main` inside the hero; sections appear in order Hero, Focus (pillars as `•` list), Sectors (6), Fieldwork (4 photos with alt), Technology (3 steps), Supporting note; no element text matches `/^\d{2}$/`.
- [ ] **Step 2:** Build the page from `loadPages()`, `loadPropertyTypes()`, `loadPillars()`, `loadFieldwork()`. Editorial layout: hero is two columns on desktop (text left, `Photo` right, `priority`), sections separated by hairline borders, lists as definition-style rows (title left, text right) without card shadows.
- [ ] **Step 3:** Run e2e (including axe) → PASS. Take desktop and mobile screenshots into the scratchpad and inspect them (header solid, no overflow at 375 px). **Step 4: Commit** `feat(web): home page`.

### Task 8: Services and Portfolio pages

**Files:** Modify `web/src/pages/[lang]/[...slug].astro` (dispatch by `routeKey`), Create `web/src/components/pages/ServicesPage.astro`, `PortfolioPage.astro`.

- [ ] **Step 1: Tests first** (e2e): services page lists 6 services each with its deliverables as `<li>` and 4 engagement models; portfolio page lists 12 projects grouped or filterable by `sector[lang]` without client JS (anchored groups) and a clients list of 14 names; counts asserted per language.
- [ ] **Step 2:** Implement. Group portfolio by sector; clients as a simple text list with category. Replace the placeholder for these two route keys.
- [ ] **Step 3:** Run e2e → PASS. **Step 4: Commit** `feat(web): services and portfolio pages`.

### Task 9: Insights and About pages

**Files:** Create `web/src/components/pages/InsightsPage.astro`, `AboutPage.astro`; Modify `ui.ts` (`nav.research`: id `Wawasan`, en `Insights`; route slugs unchanged).

- [ ] **Step 1: Tests first** (e2e): insights page shows 4 articles each with category, title, summary and ≥ 3 highlight bullets; about page shows the 3 story paragraphs, 5 pillars as bullets, and the standards list (5) with the codes exactly as migrated; nav label for research is `Wawasan` (id) and `Insights` (en).
- [ ] **Step 2:** Implement and update `ui.test.ts` expectations if needed.
- [ ] **Step 3:** Run e2e + unit → PASS. **Step 4: Commit** `feat(web): insights and about pages`.

### Task 10: Careers list, job detail, dynamic routes

**Files:** Modify `routes.ts`, `seo.ts`, `sitemap.ts`, `LangSwitch.astro`, `BaseLayout.astro`, `[...slug].astro`; Create `web/src/components/pages/CareersPage.astro`, `JobPage.astro`.

**Interfaces:** `careerPath(slug: string, lang: Locale): string` → `/id/karir/<slug>/` | `/en/careers/<slug>/`; `buildSeo` input gains optional `paths?: Record<Locale, string>` overriding `pathFor(routeKey, lang)` for canonical and alternates; `LangSwitch` and `BaseLayout` gain optional `paths`; `buildSitemap(siteUrl: string, extraPaths?: Record<Locale, string>[]): string`.

- [ ] **Step 1: Tests first:**
  - Unit: `careerPath('building-manager','en') === '/en/careers/building-manager/'`; `buildSeo({... paths})` canonical and alternates use the override and `x-default` is the Indonesian path; `buildSitemap` with one extra entry has 16 `<loc>` and every alternate href is listed.
  - E2E: `/id/karir/` lists only active jobs (count equals `loadActiveJobs(today).length`); a job detail shows responsibilities, qualifications, benefits as `•` lists and exactly one CTA (`mailto:` apply link); language switch from `/id/karir/building-manager/` goes to `/en/careers/building-manager/`; `/id/karir/tidak-ada/` is 404; a job fixture with `validThrough` in the past generates no page (unit-level via the path builder `activeJobPaths(jobs, today)`).
- [ ] **Step 2:** Implement. `getStaticPaths` creates detail pages only from `loadActiveJobs(today)` where `today` is the build date (UTC, date-only). Detail pages use `paths` for SEO and language switch.
- [ ] **Step 3:** Run unit + e2e → PASS. **Step 4: Commit** `feat(web): careers list and job detail pages`.

### Task 11: Contact page

**Files:** Create `web/src/components/pages/ContactPage.astro`.

- [ ] **Step 1: Tests first** (e2e): contact page shows address, `mailto:` and `tel:` links from settings, the service areas list (6) as `•`, and exactly one primary CTA (email); no `<form>` element exists yet.
- [ ] **Step 2:** Implement. **Step 3:** Run → PASS. **Step 4: Commit** `feat(web): contact page`.

### Task 12: Structured data and llms.txt

**Files:** Create `web/src/lib/jsonld.ts`, `web/src/components/JsonLd.astro`, `web/src/pages/llms.txt.ts`; Modify pages to emit JSON-LD.

**Interfaces:** `organizationLd(lang, settings, siteUrl): object` (`@type` `ProfessionalService`, name `PT Properti Manajemen Inovasi Indonesia`, brand `PROMIND`, address, email, telephone, url, `availableLanguage`); `serviceLd(service, lang, siteUrl)`; `breadcrumbLd(items: {name:string; path:string}[], siteUrl)`; `jobPostingLd(job, lang, siteUrl, settings)` (`datePosted` from `postedAt`, `validThrough` only when present, `hiringOrganization`, `jobLocation`, `employmentType` mapped to schema.org values, `directApply: false`); `buildLlmsTxt(siteUrl, pages): string`.

- [ ] **Step 1: Tests first** (unit): `organizationLd` has `@context`, `telephone` and `email` equal to settings, no undefined values; `jobPostingLd` omits `validThrough` when absent and includes `datePosted` as `YYYY-MM-DD`; `breadcrumbLd` positions start at 1 with absolute URLs; `buildLlmsTxt` begins with `# PROMIND`, lists every static route in both languages with absolute URLs and a one-line description from `pages.*.seo.description`. E2E: every page has one `application/ld+json` block that parses as JSON, job pages have `JobPosting`, home has `ProfessionalService`, no CSP violation is logged.
- [ ] **Step 2:** Implement and emit (`Organization` on every page, `BreadcrumbList` on non-home, `Service` on services, `JobPosting` on job detail). JSON-LD is a data block, so it does not need `unsafe-inline`.
- [ ] **Step 3:** Run → PASS. **Step 4: Commit** `feat(web): JSON-LD and llms.txt`.

### Task 13: Whole-site verification

**Files:** Modify `smoke.spec.ts` page list to include career detail pages; `lighthouserc.json` URLs to include `/id/layanan/`, `/id/karir/building-manager/`, `/en/portfolio/`.

- [ ] **Step 1:** Extend the e2e page matrix (axe at all impacts now, closing the stage 1 deferred minor: assert zero violations), and the Lighthouse URL list.
- [ ] **Step 2:** Run `npx vitest run`, `npx playwright test`, and `./node_modules/.bin/lhci autorun` → all green with perf/a11y/seo/bp ≥ 0,95, LCP ≤ 1500 ms, CLS ≤ 0,05, each page ≤ 500 KB. If a page misses, fix the cause (image sizes, preload), do not lower thresholds.
- [ ] **Step 3: Commit** `test(web): whole-site e2e and Lighthouse coverage`.

---

## Self-review

- **Spec coverage:** koleksi bertipe dan gate bilingual (T1), migrasi konten dan English native (T2–5), 8 halaman termasuk detail lowongan (T7–11), JSON-LD/`llms.txt`/OG (T6, T12), pengujian dan anggaran (T13). Di luar tahap ini: form kontak, IndexNow, admin (tahap 3), redirect 301 dan cutover (tahap 4). FAQ jawaban-dulu ditunda karena butuh konten baru dari pemilik.
- **Konsistensi tipe:** loader dan skema didefinisikan di T1 dan dipakai tanpa perubahan nama di T2–T12; `paths` override didefinisikan di T10 dan dipakai di T10/T12.
- **Risiko:** kualitas English native perlu review pemilik (`REVIEW.md`); data meragukan (sertifikasi, domain email) tidak dikoreksi sendiri.
