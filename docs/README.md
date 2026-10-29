# PROMIND Revamp — Dokumentasi

Titik awal untuk siapa pun (developer, editor konten, agent AI) yang mengerjakan situs company profile PROMIND (PT Properti Manajemen Inovasi Indonesia). Baca file ini dulu, lalu buka dokumen yang relevan.

## Status (2026-10-28)

| Tahap | Isi | Status |
|---|---|---|
| 1. Fondasi | Astro statis, token desain, font, i18n dua bahasa, SEO dasar, header keamanan, e2e, CI | Selesai |
| 2. Konten dan halaman | Konten JSON bertipe, 7 halaman + detail lowongan, JSON-LD, `llms.txt`, gambar OG | Selesai |
| 3. Portal admin | Worker + D1, editor dua bahasa, publish ke Git, form kontak | Selesai, live di admin.promind.co.id |
| 4. Hardening dan cutover | Deploy ke Cloudflare, staging, redirect 301, produksi | Cutover selesai 2026-10-29 (lihat D10). Sisa: pensiun portal PHP, proteksi branch main |

Situs lama (Vite SPA + portal PHP di Rumahweb) **masih yang live** dan tidak tersentuh. Pekerjaan baru ada di branch `revamp`, folder `web/`, dan belum ter-push ke GitHub.

## Peta dokumen

| Dokumen | Untuk apa |
|---|---|
| [architecture.md](architecture.md) | Arsitektur target, struktur kode, model konten, i18n, SEO/GEO, keamanan |
| [content-guide.md](content-guide.md) | Cara mengubah konten (sebelum admin ada), aturan terjemahan dan brand |
| [quality-and-testing.md](quality-and-testing.md) | Anggaran performa, pengujian, CI, hasil terukur |
| [decisions.md](decisions.md) | Log keputusan beserta alasan dan biaya bila keliru |
| [resume-here.md](resume-here.md) | Titik simpan terbaru: apa yang sedang berjalan dan langkah lanjut |
| [roadmap.md](roadmap.md) | Tahap 3 dan 4, prasyarat, tindakan pemilik, utang teknis |
| [superpowers/specs/2026-10-28-promind-revamp-design.md](superpowers/specs/2026-10-28-promind-revamp-design.md) | Spec desain yang disetujui pemilik |
| [superpowers/plans/](superpowers/plans/) | Rencana implementasi per tahap (tahap 1 dan 2) |
| [../web/content/REVIEW.md](../web/content/REVIEW.md) | Data dari situs lama yang meragukan dan perlu dikonfirmasi pemilik |
| [../PRODUCT.md](../PRODUCT.md) | Pengguna, tujuan produk, kepribadian brand, anti-referensi |
| [../AGENTS.md](../AGENTS.md) | Aturan kerja untuk agent AI |

## Mulai cepat

Semua perintah dijalankan dari folder `web/`. Butuh Node 22 atau lebih baru.

```bash
cd web
npm install
npm run dev            # server pengembangan
npm run build          # build statis ke web/dist
npm run preview        # sajikan hasil build di http://127.0.0.1:4321
npx vitest run         # 156 tes unit dan tes konten
npx playwright install chromium   # sekali saja
npx playwright test    # 118 tes e2e (membangun dan menyajikan situs sendiri)
./node_modules/.bin/lhci autorun   # Lighthouse pada 6 halaman, setelah npm run build
```

Variabel lingkungan: `SITE_URL` (default `https://promind.co.id`). Build staging **wajib** mengisinya supaya canonical, hreflang, dan sitemap tidak menunjuk ke domain produksi.

## Struktur repositori

```
/                      Situs LAMA (Vite SPA, portal PHP di public/portal). Tetap live sampai cutover.
web/                   Situs BARU (Astro statis). Semua pekerjaan revamp ada di sini.
  content/             Konten JSON dua bahasa (sumber kebenaran), REVIEW.md
  src/                 Kode: i18n, skema konten, builder SEO, komponen, halaman
  tests/               Tes e2e (Playwright) dan tes build
docs/                  Dokumentasi ini, spec, dan rencana
.github/workflows/     deploy.yml (situs lama, dari main) dan web-ci.yml (situs baru)
```

## Hal yang perlu diketahui sebelum mulai

1. Branch `revamp` jangan di-merge ke `main` sebelum tahap 4: `deploy.yml` di `main` otomatis meng-upload ke Rumahweb.
2. Password admin portal lama pernah tertulis di repo ini. Ganti password itu di portal produksi (tindakan pemilik).
3. `node_modules/` ter-track di repo lama (bukan di `web/`). Jangan commit perubahan di dalamnya.
