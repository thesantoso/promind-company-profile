# PROMIND Revamp — Design Spec

Tanggal: 2026-10-28
Repo: `promind-company-profile`
Status: draf untuk review pemilik

## 1. Tujuan

Website company profile PT Properti Manajemen Inovasi Indonesia (PROMIND) yang kontennya diatur tim non-teknis lewat portal admin, dengan performa, SEO, dan GEO terbaik, dalam dua bahasa (Indonesia dan English US) berkualitas native.

Pengguna situs: pemilik gedung, asset manager, dan developer yang menilai mitra manajemen properti. Pengguna admin: 1–3 editor internal.

### Batasan dari pemilik

- Tidak memasukkan kartu pembayaran ke Cloudflare. Hanya layanan yang benar-benar gratis tanpa kartu.
- Email `promind.co.id` tetap di cPanel Rumahweb (unlimited). Record MX tidak berubah.
- Portal admin PHP lama boleh diganti.
- Aturan brand di `AGENTS.md` dan `PRODUCT.md` tetap berlaku (header putih solid `#ffffff`, Manrope + DM Sans, bullet `•`, satu CTA per section, anti-AI-slop).
- Fitur interaktif lama (Digital Twin, Command Console, ROI Calculator, Live Ticker) **tidak diperlukan** dan dibuang (keempatnya memang tidak di-import di mana pun saat ini).

### Di luar cakupan

Fitur interaktif baru, blog, dan komentar. Workflow persetujuan berlapis (editor sedikit, cukup peran admin dan editor).

## 2. Arsitektur

```
Editor ──► admin.promind.co.id (Worker + D1)
              │ draft tersimpan di D1
              │ Publish
              ▼
        GitHub (repo privat) ──► GitHub Actions: build Astro + Lighthouse CI
                                         │
                                         ▼
Pengunjung ──► promind.co.id (HTML statis di edge Cloudflare)

Email ──► Rumahweb (MX tidak berubah)
Form kontak: Worker ──► endpoint PHP di Rumahweb ──► email cPanel
```

| Komponen | Pilihan | Alasan |
|---|---|---|
| Situs publik | Astro, output statis, island React hanya bila perlu | Nol JS default, HTML lengkap untuk SEO/GEO |
| Hosting situs | Cloudflare Workers static assets | Gratis, edge global, tanpa kartu (belum diverifikasi, lihat 9) |
| Admin | Worker (Hono) + SPA React di `admin.promind.co.id` | Antarmuka modern, gratis |
| Penyimpan draft, user, sesi, audit | Cloudflare D1 | Hanya disentuh admin dan build, jauh di bawah kuota gratis |
| Sumber kebenaran konten terbit | Git (repo privat), termasuk gambar | Riwayat, rollback, tanpa R2 |
| Build dan deploy | GitHub Actions | Gratis, menggantikan FTP |
| Form kontak | Worker → PHP kecil di Rumahweb, Turnstile + HMAC | Cloudflare gratis tidak bisa SMTP |
| Email | Rumahweb cPanel | Sesuai batasan |

`portal.promind.co.id` (PHP) dipensiunkan setelah cutover.

## 3. Model konten dan i18n

- Koleksi bertipe dengan skema Zod: halaman, layanan, jenis properti, portofolio, riset, lowongan, klien, slide hero, pengaturan situs (alamat, kontak, jam operasional), dan flag maintenance.
- Setiap entri punya bidang `id` dan `en` berdampingan. Teks English ditulis sebagai konten sendiri (ejaan en-US), bukan terjemahan harfiah. Draf awal ditulis saat migrasi dan direview pemilik.
- URL per bahasa dengan slug diterjemahkan: `/id/layanan`, `/en/services`. `hreflang` dan `x-default` di setiap halaman, metadata dan JSON-LD per bahasa. Root `/` mengarahkan ke bahasa yang sesuai satu kali, bukan berulang.
- Gate publikasi: entri tidak bisa terbit bila salah satu bahasa belum lengkap atau alt text gambar kosong di salah satu bahasa.
- Format dan satuan mengikuti bahasa (tanggal, angka, mata uang) lewat util tunggal.

## 4. Portal admin

- Editor dua kolom ID | EN dengan penanda status terjemahan per bagian.
- Upload gambar dikompres di browser (batas ukuran, tipe diverifikasi di server). Alt text wajib di kedua bahasa. Varian AVIF/WebP dibuat Astro saat build.
- Pratinjau sebelum terbit. Setelah Publish: status build langsung (sedang build, live, gagal).
- Riwayat perubahan dengan tombol kembalikan (dari Git), dua peran (admin, editor), log audit.
- Lowongan: toggle aktif dan tanggal berakhir. Maintenance mode lewat flag yang dibaca Worker di depan situs.
- Alur Publish: admin memvalidasi draf (Zod), commit ke repo lewat GitHub API atas nama editor, Actions build dan deploy, edge cache di-purge, ping IndexNow.
- Perubahan live sekitar 1–2 menit setelah Publish (diterima pemilik).

## 5. Performa

Anggaran, dijaga Lighthouse CI di Actions (build gagal bila dilanggar):

- LCP < 1,5 dtk (mobile, 4G), CLS < 0,05, INP < 150 ms.
- JS halaman biasa < 60 KB gzip, total halaman < 500 KB.

Teknik:

- Font Manrope dan DM Sans di-host sendiri (woff2 variabel, subset, preload, `font-display: swap`), tanpa Google Fonts.
- Satu pipeline CSS: Tailwind 4 dengan token desain. `public/styles-exact.css` dimigrasi ke token lalu dihapus. Dependency three.js, `lucide-react` penuh, dan kode mati dihapus.
- Gambar AVIF/WebP responsif, gambar hero di-preload, sisanya lazy.
- Aset ber-hash `immutable` 1 tahun. HTML di-cache di edge dan di-purge saat Publish.

## 6. SEO dan GEO

- HTML lengkap sejak awal, sitemap dengan `hreflang`, canonical, gambar OG per halaman.
- JSON-LD: `Organization`, `ProfessionalService`, `Service`, `BreadcrumbList`, `JobPosting` (Google for Jobs).
- GEO: heading semantik, paragraf jawaban-dulu, bagian FAQ, fakta perusahaan yang konsisten (nama, alamat, telepon), `llms.txt`, crawler AI diizinkan di `robots.txt`. Efektivitas `llms.txt` belum terbukti, diperlakukan sebagai pelengkap.
- IndexNow otomatis setiap Publish.
- Tugas pemilik di luar kode: Google Business Profile dan konsistensi nama/alamat/telepon di direktori lain.

## 7. Keamanan

Situs publik:

- Statis, hampir tanpa permukaan serangan. Header lewat `_headers`: CSP ketat, HSTS, `nosniff`, `frame-ancestors`, `Referrer-Policy`.

Admin:

- Password di-hash kuat (scrypt/PBKDF2 via WebCrypto), 2FA TOTP wajib, pembatasan percobaan login, sesi berumur pendek.
- Cookie `HttpOnly`, `Secure`, `SameSite=Strict`, CSRF token, CSP ketat.
- Validasi Zod di server. Tidak ada HTML mentah dari editor (rich text disanitasi). Validasi tipe dan ukuran upload.
- Token GitHub fine-grained, hanya untuk satu repo dengan izin konten, disimpan sebagai secret Worker.
- Dependabot aktif. Tidak ada FTP.

**Tindakan segera (tidak menunggu revamp):** password admin lama `Promind2026!` tercatat di `HANDOVER.md` dan harus diganti, lalu dihapus dari dokumen.

## 8. Migrasi dan pengujian

Migrasi:

- Situs baru dibangun paralel di `staging.promind.co.id`, situs lama tetap live.
- Konten dipindah dari `src/data/promindContent.js` dan `public/api/site-content.json` ke koleksi bertipe. Versi English ditulis ulang native.
- Peta redirect 301 untuk URL lama (path bersih dan hash `#/`).
- Cutover dengan mengganti DNS. Rollback juga lewat DNS. Portal PHP dipensiunkan setelah situs baru stabil.

Pengujian:

- Unit test skema konten dan util i18n.
- End-to-end Playwright untuk alur login, edit, publish di admin dan smoke test halaman publik di kedua bahasa.
- Pemeriksaan aksesibilitas otomatis (kontras, fokus keyboard, `prefers-reduced-motion`).
- Lighthouse CI untuk anggaran performa dan SEO.

## 9. Asumsi yang harus diverifikasi sebelum implementasi

1. Workers, D1, KV (bila dipakai), dan Turnstile aktif tanpa kartu pada akun Cloudflare yang dipakai. R2 sengaja tidak dipakai karena kemungkinan butuh kartu. Bila ada layanan yang ternyata butuh kartu, desain disesuaikan sebelum lanjut.
2. Batas D1 gratis (baca/tulis harian, ditegakkan sejak 1 September 2026) memang jauh di atas pemakaian admin dan build.
3. Batas ukuran repo Git cukup untuk gambar (batas ukuran upload per file ditetapkan saat implementasi).
4. Rumahweb mengizinkan endpoint PHP pengirim email dipanggil dari Worker (pembatasan kirim email cPanel).

## 10. Tahapan implementasi

Masing-masing mendapat rencana implementasi sendiri:

1. **Fondasi:** proyek Astro, token desain, font, layout, i18n dan routing dua bahasa, header/footer sesuai brand.
2. **Konten dan halaman:** koleksi bertipe, migrasi konten, 8 halaman, SEO/JSON-LD/GEO, form kontak.
3. **Admin:** autentikasi + 2FA, editor dua bahasa, upload gambar, alur Publish ke Git, riwayat, audit.
4. **Hardening dan cutover:** Lighthouse CI, uji e2e, header keamanan, staging, redirect, DNS cutover, pensiun portal PHP.
