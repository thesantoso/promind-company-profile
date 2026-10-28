# PROMIND — Agent Context & Project Guide

Dokumen ini adalah **single source of truth** untuk semua Autonomous Agent dan developer yang bekerja pada repositori **PROMIND** (`PT Properti Manajemen Inovasi Indonesia`).

---

## 1. Project Overview & Identitas Brand

- **Nama Entitas**: PT Properti Manajemen Inovasi Indonesia
- **Brand Utama**: **PROMIND** (Wajib huruf kapital penuh `PROMIND`, dilarang menggunakan nama brand lama/pihak ketiga seperti "Indoland" atau "PROAPPS" pada konten publik).
- **Domain Layanan**: Manajemen Properti Komersial, Perkantoran (Office Tower), Apartemen Mewah, Pusat Perbelanjaan (Mall), dan Kawasan Industri Terintegrasi.
- **Tujuan Utama**: Portal company profile berkelas enterprise/editorial yang cepat (<100ms TTFB), elegan, tanpa *AI slop*, dilengkapi Admin Operations Portal mandiri untuk update karir dan data perusahaan secara instan.

### 1.1. URL & Endpoint Resmi (Live Production)
- **Website Utama**: [https://promind.co.id](https://promind.co.id) (atau `https://www.promind.co.id`)
- **Admin Operations Portal**: [https://portal.promind.co.id](https://portal.promind.co.id) (atau `https://promind.co.id/portal`)
- **Email Webmail cPanel**: [https://webmail.promind.co.id](https://webmail.promind.co.id)
- **cPanel Hosting**: [https://cpanel.promind.co.id](https://cpanel.promind.co.id)

---

## 2. Arsitektur Infrastruktur & Ekosistem

Aplikasi telah sepenuhnya dimigrasikan dari Cloudflare Workers lama (`thesantoso`) ke infrastruktur mandiri milik perusahaan:

```
+-----------------------------------------------------------------------------------+
|                        CLOUDFLARE DNS & SECURITY (AKUN BARU)                      |
|   - NS: trey.ns.cloudflare.com / walk.ns.cloudflare.com                           |
|   - SSL Mode: Full | Always Use HTTPS: ON | Security Level: Medium                |
+-----------------------------------------------------------------------------------+
        | (Proxied: 80/443)                           | (DNS Only: Ports 2096/993/465)
        v                                             v
+-----------------------------------------------------------------------------------+
|               RUMAHWEB UNLIMITED HOSTING (cPanel + LiteSpeed Web Server)          |
|               IP Server: 103.247.10.230 | User: prom9466                          |
|                                                                                   |
|   /public_html                                                                    |
|   ├── index.html, assets/, styles-exact.css   --> Frontend SPA (Vite + React)     |
|   ├── .htaccess                               --> LiteSpeed SPA Fallback & Cache  |
|   ├── api/site-content.json                   --> Local Data Source (Real-time)   |
|   │                                                                               |
|   └── /portal                                 --> Admin Operations Portal         |
|       ├── index.php                           --> Native PHP 8.3 Dashboard        |
|       ├── config.php                          --> Protected Auth & Bcrypt Hash    |
|       └── .htaccess                           --> Security & File Shield          |
+-----------------------------------------------------------------------------------+
```

### 2.1. Komponen Stack
- **Frontend**: React 18 SPA + Vite (`@vitejs/plugin-react`)
- **Styling**: Dual-layer (Tailwind CSS + `public/styles-exact.css` untuk akurasi editorial tinggi)
- **Web Server**: LiteSpeed Web Server (Apache compatible) pada hosting Rumahweb
- **Admin Portal**: Native PHP 8.3 (`/public_html/portal`)
  - Login ber-password (Bcrypt hash) + proteksi anti-CSRF
  - Menyimpan langsung perubahan ke `/public_html/api/site-content.json`
- **DNS & CDN**: Cloudflare (Zone ID: `80f692f7edf0017f6d55ceaa4db3af42`)
- **Email Server**: cPanel Unlimited Mailbox (`mail.promind.co.id` & `webmail.promind.co.id`)

---

## 3. Desain Sistem & Aturan Visual (Strict Anti-"AI Slop")

> [!IMPORTANT]
> **DILARANG MENGGUNAKAN GAYA AI SLOP** seperti: badge angka biru menyala di dalam kotak (`01`, `02`), gradien berlebihan, kartu mengambang tak beraturan, form panjang acak-acakan, atau tombol action bertumpuk.

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

### 3.2. Typography Rules
- Font Keluarga: `Manrope` (Display/Headings) dan `DM Sans` (Subhead/Body).
- List / Poin Kualifikasi & Tanggung Jawab: **Wajib menggunakan bullet dot (`•`)**, hindari penomoran kotak badge (`01`, `02`).
- Call-to-Action (CTA): Cukup **1 arahan tegas** di setiap section/halaman.

---

## 4. Struktur Repositori & Routing

Repositori utama yang aktif untuk deployment adalah:
**`https://github.com/thesantoso/promind-company-profile.git`**

### 4.1. Direktori Kunci
- `src/App.jsx`: Root component dengan hybrid routing (mendukung clean path `/careers/slug`, `/services` dan hash `#` fallback).
- `src/react-pages/`: Komponen halaman (HomePage, ServicesPage, PortfolioPage, ResearchPage, AboutPage, CareersPage, CareerDetailPage, ContactPage).
- `public/portal/`: Source code Admin Portal (PHP 8.3) yang otomatis ter-copy ke `dist/portal/` saat build.
- `public/api/site-content.json`: Snapshot data lokal untuk lowongan karir, info perusahaan, dan pilar layanan.
- `public/.htaccess`: Routing rewrite rules untuk LiteSpeed/Apache.

---

## 5. Alur CI / CD & Deployment Otomatis

File CI/CD: [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml)

### 5.1. Mekanisme Kerja:
1. Developer / Agent melakukan `git push origin main`.
2. GitHub Runner (Ubuntu) otomatis menjalankan:
   - `npm install`
   - `npm run build` (menghasilkan folder `dist/`)
   - `SamKirkland/FTP-Deploy-Action@v4.3.5` melakukan sinkronisasi file ke `/public_html` di server Rumahweb.

### 5.2. GitHub Action Secrets yang Digunakan:
- `FTP_SERVER`: `103.247.10.230`
- `FTP_USERNAME`: `prom9466`
- `FTP_PASSWORD`: *(Sesuai kredensial cPanel Rumahweb)*

---

## 6. Kredensial & Akses Cepat

- **FTP Server / Host**: `103.247.10.230`
- **FTP User**: `prom9466`
- **FTP Target Path**: `/public_html`
- **Admin Portal URL**: `https://portal.promind.co.id`
  - **Username Default**: `admin`
  - **Password Default**: `Promind2026!`
- **Cloudflare Account**:
  - Akun Baru: `Pmii.promind@gmail.com`
  - Account ID: `7652f9cb63208f7960df98b60dab1eab`
  - Zone ID `promind.co.id`: `80f692f7edf0017f6d55ceaa4db3af42`

---

## 7. Checklist untuk Agent Berikutnya

- [ ] Pastikan Header tetap solid putih (`#ffffff`) di semua halaman dan tidak transparan saat scroll.
- [ ] JANGAN menggunakan brand lama / pihak ketiga ("Indoland" atau "PROAPPS") pada copywriting publik.
- [ ] Ketika menambah fitur baru di frontend, jalankan `npm run build` dan verifikasi tidak ada error sintaks.
- [ ] Jangan pernah melakukan commit token/password plaintext ke dalam Git repository.
