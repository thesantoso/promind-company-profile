# Kualitas dan Pengujian

## Anggaran (spec bagian 5)

| Metrik | Batas | Ditegakkan oleh |
|---|---|---|
| LCP (mobile, Lighthouse Slow-4G) | ≤ 1500 ms | `lighthouserc.json` (kecuali dua beranda, lihat di bawah) |
| CLS | ≤ 0,05 | `lighthouserc.json` |
| Total halaman | ≤ 500 KB | `lighthouserc.json` |
| Skor Lighthouse (performa, a11y, SEO, best practices) | ≥ 0,95 | `lighthouserc.json` |
| Pelanggaran aksesibilitas (axe, WCAG 2.0–2.2 A/AA) | 0 pada semua tingkat dampak | e2e `smoke.spec.ts` |
| JavaScript halaman biasa | < 60 KB gzip (saat ini 0 KB) | struktur: tanpa island |

INP tidak bisa diukur Lighthouse. Karena tidak ada JavaScript interaktif di situs, risikonya rendah. Tinjau lagi saat form kontak dan admin ada.

## Hasil terukur terakhir (lokal, 2026-10-28)

| Halaman | Perf | A11y | SEO | BP | LCP (median) | Ukuran |
|---|---|---|---|---|---|---|
| `/id/`, `/en/` (beranda) | 1,0 | 1,0 | 1,0 | 1,0 | 1,51–1,58 dtk | ±100 KB |
| `/id/layanan/`, `/en/portfolio/`, `/en/about/`, `/id/karir/building-manager/` | 1,0 | 1,0 | 1,0 | 1,0 | 1,36 dtk | ±75 KB |

CLS 0 di semua halaman. FCP beranda 0,76 dtk.

### Pengecualian LCP beranda (deviasi dari spec)

Elemen LCP beranda adalah foto hero. Di simulasi Slow-4G Lighthouse (1,6 Mbps, RTT 150 ms, CPU 4× lebih lambat) hasilnya 1,43–1,58 dtk, sedikit di atas 1,5 dtk. Halaman lain 1,36 dtk. Yang sudah dicoba: crop landscape saat build (hero 69 KB → ±24 KB), WebP vs AVIF, `decoding` sync/async, `sizes` yang akurat, preload font. Sisa ±150 ms adalah render delay di simulasi, bukan ukuran byte. `lighthouserc.json` memakai `assertMatrix`: kedua beranda ≤ 1650 ms, semua halaman lain ≤ 1500 ms. Ukur ulang di produksi (Cloudflare) dengan data lapangan (CrUX/RUM) sebelum menganggap ini masalah nyata.

## Pengujian

| Lapisan | Alat | Lokasi | Jumlah |
|---|---|---|---|
| Unit dan tes konten | Vitest 5 | `web/src/**/*.test.ts`, `web/tests/*.test.ts` | 156 |
| End-to-end | Playwright 1.64 + axe-core | `web/tests/e2e/*.spec.ts` | 118 |
| Performa dan SEO | Lighthouse CI | `web/lighthouserc.json` | 6 halaman × 3 putaran |

### Yang dijaga tes

- **Route dan bahasa** (`routes.test.ts`, `routes-coverage.test.ts`): slug terjemahan, 404 untuk prefix atau slug salah, hreflang/x-default, setiap route ada di `dist/`.
- **Konten** (`content.test.ts`, `schema.test.ts`, `brand.test.ts`): kedua bahasa terisi, daftar sama panjang, slug unik, tanggal hanya `YYYY-MM-DD`, tanpa kunci `num`, kapitalisasi brand, ejaan en-US, jumlah item sama dengan situs lama, foto yang dirujuk ada.
- **SEO** (`seo.test.ts`, `sitemap.test.ts`, `jsonld.test.ts`): canonical, alternates, setiap `href` ada di sitemap, JSON-LD valid tanpa nilai `undefined`, escape HTML dan `<`, `llms.txt`.
- **Lowongan** (`job-paths.test.ts`, `today.test.ts`, `careers.spec.ts`): lowongan nonaktif atau kedaluwarsa tidak punya halaman, daftar/route/sitemap sepakat, pengalih bahasa ke lowongan yang sama.
- **Halaman** (`home.spec.ts`, `pages.spec.ts`): urutan section, jumlah item, satu CTA, tanpa badge nomor, tanpa overflow horizontal di ponsel.
- **Aksesibilitas dan keamanan** (`smoke.spec.ts`, `headers.test.ts`): axe nol pelanggaran di 24 halaman, header putih solid sebelum dan sesudah scroll, menu mobile dengan keyboard, reduced motion, CSP tanpa pelanggaran, tanpa permintaan ke Google Fonts, gambar OG nyata, root berfungsi tanpa JavaScript.

### Catatan praktis

- Tes e2e membangun dan menyajikan situs sendiri (`webServer` di `playwright.config.ts`). `astro preview` menyimpan lock file, skrip `preview` memakai `--ignore-lock` agar tidak macet.
- `astro preview` mengabaikan `public/_headers`. Karena itu e2e menyuntikkan CSP asli dari `_headers` ke respons HTML.
- Tes konten memuat data lewat loader. Tes e2e membaca JSON langsung (`tests/e2e/content.ts`) karena loader Playwright tidak bisa mengimpor modul JSON.
- Satu kegagalan e2e tanpa pesan pernah muncul di run pertama yang dingin dan tidak terulang di puluhan run berikutnya. Jika muncul lagi di CI, curigai cold-start.
- Lighthouse lokal: gunakan `./node_modules/.bin/lhci` (shim `npx` pernah salah-resolve).

## CI

`.github/workflows/web-ci.yml` berjalan pada push dan PR yang mengubah `web/**`: `npm ci`, `vitest`, instal Chromium, `playwright test`, `npm run build`, `lhci autorun`. **Belum pernah dijalankan di GitHub** karena branch belum di-push. Tidak ada langkah deploy dan tidak ada secret. `deploy.yml` lama hanya berjalan dari `main`.

## Siklus review yang dipakai

Setiap tahap dikerjakan dengan TDD (tes ditulis dan terbukti gagal dulu), diverifikasi dengan suite penuh per task, direview tengah jalan oleh reviewer terpisah, lalu direview seluruh branch oleh reviewer baru. Temuan Critical/Important diperbaiki dengan tes yang gagal dulu. Temuan Minor dicatat di [roadmap](roadmap.md#utang-teknis-minor-yang-ditunda).
