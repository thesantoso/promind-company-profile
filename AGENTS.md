# PROMIND — Agent Context & Project Guide

Dokumen ini adalah **single source of truth** untuk semua Autonomous Agent dan developer yang bekerja pada repositori **PROMIND** (`PT Properti Manajemen Inovasi Indonesia`).

---

## 1. Project Overview & Tujuan

- **Nama Project**: PROMIND Company Profile & Headless CMS
- **Entitas**: PT Properti Manajemen Inovasi Indonesia
- **Domain Layanan**: Manajemen Properti Komersial, Perkantoran, Apartemen, dan Kawasan Industri Terintegrasi (Building Management, Engineering, Tenancy, Tenant Relations, HSE, Operational Assessment).
- **Tujuan Utama**: Menghadirkan portal company profile berkelas enterprise/editorial yang cepat, modern, tanpa *AI slop*, serta didukung Headless CMS (*EmDash*) dan Edge Database (*Cloudflare D1*) agar seluruh konten dinamis dapat dikelola oleh tim non-teknis tanpa perlu mengubah kode sumber.
- **Production URL**: [https://promind.thesantoso.workers.dev](https://promind.thesantoso.workers.dev)
- **CMS Admin URL**: [https://promind.thesantoso.workers.dev/_emdash/admin](https://promind.thesantoso.workers.dev/_emdash/admin)

---

## 2. Arsitektur Teknologi

```
+-----------------------------------------------------------------+
|                        Cloudflare Worker                        |
|                                                                 |
|   +--------------------+              +---------------------+   |
|   |  Astro SSR Adapter | <----------> |  EmDash Headless    |   |
|   |  (@astrojs/cloudf.)|              |  CMS Core Engine    |   |
|   +---------+----------+              +----------+----------+   |
|             |                                    |              |
|   +---------v----------+              +----------v----------+   |
|   |  React SPA Island  |              |  Cloudflare D1 DB   |   |
|   |  (Hash Router)     |              |  (promind-db)       |   |
|   +--------------------+              +---------------------+   |
|             |                                    |              |
|   +---------v----------+              +----------v----------+   |
|   |  Public Exact CSS  |              |  Cloudflare KV      |   |
|   |  (/styles-exact.css|              |  (Session Binding)  |   |
|   +--------------------+              +---------------------+   |
+-----------------------------------------------------------------+
```

- **Frontend Framework**: Astro SSR + React 18 (`@astrojs/react`)
- **Runtime & Deployment**: Cloudflare Workers (SSR Mode)
- **Headless CMS Engine**: EmDash CMS (`emdash/astro` + `@emdash-cms/cloudflare`)
- **Database**: Cloudflare D1 (`promind-db`, ID: `69b62e8d-e914-47ad-af09-5474b7d00dc5`)
- **Session Store**: Cloudflare KV Namespace (`a53a01e6c6fb46fb8e47cdd6f7d54c65`)
- **Styling Pipeline**: Dual Layer:
  1. Tailwind CSS (`src/styles/global.css`)
  2. Native High-Precision Editorial Stylesheet (`public/styles-exact.css`) yang di-load langsung di `src/layouts/Layout.astro` dengan cache-busting.

---

## 3. Design System & Visual Rules (Strict Anti-"AI Slop")

> [!IMPORTANT]
> **DILARANG MENGGUNAKAN GAYA AI SLOP** seperti: badge angka biru menyala di dalam kotak, gradien berlebihan, kartu mengambang tak beraturan, form panjang acak-acakan, atau tombol action bertumpuk.

### 3.1. Color Palette
- **Header / Navigasi**: Solid Natural White `#ffffff` (Wajib solid 100%, **tidak boleh transparent/blur** baik saat posisi atas maupun di-scroll).
- **Background Utama (Stone Neutral)**: `#f6f5f1`
- **Surface / Card Background**: `#ffffff` (bersih, natural)
- **Sub-surface / Neutral Tint**: `#eef2f4` / `#f9f8f5`
- **Hairline Borders**: `#d8dfe5` / `#cbd2d9` (garis tipis 1px editorial)
- **Primary Typography (Manrope)**: `#172b42` (headings, angka besar, label tegas)
- **Body Typography (DM Sans)**: `#526374` / `#586878` (line-height 1.7–1.85 yang nyaman dibaca)
- **Primary Blue Accent**: `#2b5caf` / Hover `#194586`
- **Navy Accent**: `#183b68`

### 3.2. Komitmen Brand & Terminologi
- **PROAPPS**: Selalu gunakan huruf kapital penuh `PROAPPS`.
- **PROMIND**: Huruf kapital penuh `PROMIND` (PT Properti Manajemen Inovasi Indonesia).

### 3.3. Typography Rules
- Font Keluarga: `Manrope` (Display/Headings) dan `DM Sans` (Subhead/Body).
- List / Poin Kualifikasi & Tanggung Jawab: **Wajib menggunakan bullet dot (`•`)**, hindari penomoran kotak badge (`01`, `02`).
- Call-to-Action (CTA): Cukup **1 arahan tegas** di setiap section/halaman, hindari duplikasi tombol lamar / kontak.

---

## 4. Struktur Routing & Halaman

Aplikasi menggunakan React Hash Routing yang dipasang pada root Astro `index.astro`:

| Hash Route | Komponen React | Deskripsi |
|---|---|---|
| `#/` atau `#/home` | `src/react-pages/HomePage.jsx` | Hero slider, value proposition, pillars, fieldwork, marquee klien |
| `#/services` | `src/react-pages/ServicesPage.jsx` | 6 pilar layanan operasional terpadu |
| `#/portfolio` | `src/react-pages/PortfolioPage.jsx` | Portofolio proyek gedung & properti kelolaan |
| `#/research` | `src/react-pages/ResearchPage.jsx` | Riset pasar, operational audit, studi kelayakan |
| `#/about` | `src/react-pages/AboutPage.jsx` | Profil perusahaan, filosofi operasional, jajaran |
| `#/careers` | `src/react-pages/CareersPage.jsx` | Daftar lowongan karir aktif (dari D1 / EmDash) |
| `#/careers/:slug` | `src/react-pages/CareerDetailPage.jsx` | Detail lowongan, spesifikasi pekerjaan, instruksi kirim CV |
| `#/contact` | `src/react-pages/ContactPage.jsx` | Alamat kantor pusat, channel email, form kontak |

---

## 5. Integrasi Dinamis & Headless CMS (EmDash + D1)

Semua konten dinamis disimpan di Cloudflare D1 dan disinkronkan ke API endpoint Astro:

### 5.1. Database Tables (D1 `promind-db`)
1. **`jobs`**: Lowongan karir (`job_slug`, `title`, `department`, `location`, `employment_type`, `application_email`, `responsibilities`, `qualifications`, `benefits`, `is_active`).
2. **`hero_slides`**: Slide banner foto hero beranda (`image_url`, `alt_text`, `sort_order`, `is_active`).
3. **`services`**: Pilar cakupan layanan terpadu (`code`, `title`, `subtitle`, `description`, `sort_order`).
4. **`property_scopes`**: Cakupan tipe properti gedung (`code`, `title`, `description`, `metrics`, `sort_order`).
5. **`fieldwork_items`**: Galeri eksekusi di lapangan (`title`, `description`, `image_url`, `sort_order`).
6. **`site_settings`**: Alamat kantor, email, telepon, jam operasional.

### 5.2. Internal API Endpoints
- `GET /api/careers.json`: Mengembalikan daftar lowongan pekerjaan aktif.
- `GET /api/site-content.json`: Mengembalikan gabungan data dinamis (hero slides, layanan, portofolio, kontak).

---

## 6. Prosedur Build & Deployment (CI / CD Manual & Worker)

### 6.1. Environment Variables Wajib
Pastikan environment variable ini diset saat menjalankan command deployment:
```bash
CLOUDFLARE_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
```

### 6.2. Aturan Khusus Build (Wajib Diikuti Agent)
1. **Disable Astro Telemetry**:
   Selalu prefix `ASTRO_TELEMETRY_DISABLED=1` sebelum build agar tidak terkena error permission file preferences.
2. **Redirect XDG Config untuk Wrangler**:
   Gunakan `XDG_CONFIG_HOME=/tmp XDG_DATA_HOME=/tmp` agar Wrangler tidak gagal menulis log/metrics ke `~/Library/Preferences`.
3. **Bypass Sandbox Saat Deploy**:
   Deployment ke Cloudflare API membutuhkan akses jaringan keluar (gunakan mode unsandboxed / bypass sandbox).

### 6.3. One-Liner Deploy Command
Untuk mengompilasi dan mendeploy langsung ke Cloudflare:
```bash
# 1. Compile bundle Astro + React
ASTRO_TELEMETRY_DISABLED=1 npm run build

# 2. Deploy ke Cloudflare Workers
XDG_CONFIG_HOME=/tmp XDG_DATA_HOME=/tmp \
CLOUDFLARE_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID \
CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN \
npx wrangler deploy
```

---

## 7. Checklist untuk Agent Berikutnya

Sebelum menganggap pekerjaan selesai:
- [ ] Pastikan Header tetap solid putih (`#ffffff`) di semua halaman dan tidak tembus pandang saat di-scroll.
- [ ] Pastikan font, border hairline (`#d8dfe5`), dan spacing konsisten dengan halaman lain.
- [ ] Tidak ada badge angka kotak atau elemen "AI slop".
- [ ] Jalankan `npm run build` dan verifikasi tidak ada syntax / bundle error.
- [ ] Jalankan `wrangler deploy` dan pastikan Version ID baru ter-generate dan live di `https://promind.thesantoso.workers.dev`.

