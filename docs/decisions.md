# Log Keputusan

Keputusan yang diambil selama tahap 1 dan 2, dengan alasan dan biaya bila keliru. Keputusan produk besar (arsitektur, hosting) ada di [spec](superpowers/specs/2026-10-28-promind-revamp-design.md). Di sini yang tercatat adalah keputusan implementasi dan penyimpangan dari rencana.

## Keputusan besar (disetujui pemilik)

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Basis revamp: repo `promind-company-profile` | Itu yang live. Repo `promind-astro-emdash` (Cloudflare + EmDash) sudah usang. |
| D2 | Astro statis + admin Worker + Git sebagai penyimpan konten dan gambar | Performa dan SEO/GEO terbaik dari HTML statis; riwayat dan rollback gratis lewat Git; tanpa R2. |
| D3 | Hanya Cloudflare gratis tanpa kartu; R2 dicoret | Batasan pemilik. R2 kemungkinan butuh kartu terdaftar (belum terkonfirmasi resmi). |
| D4 | Email tetap di Rumahweb | Email unlimited di cPanel; hanya record web yang pindah. |
| D5 | Perubahan admin live sekitar 1–2 menit setelah Publish | Konsekuensi build statis, diterima pemilik. |
| D6 | Keempat fitur interaktif lama dibuang | Tidak terpakai di situs, dan ROI Calculator/Ticker bertentangan dengan prinsip "tanpa klaim tak terdukung". |
| D7 | Dua bahasa dengan URL terpisah dan slug diterjemahkan; English ditulis native (en-US) | SEO dan kualitas bahasa. |

## Keputusan implementasi tahap 1

| # | Keputusan | Alasan | Biaya bila keliru |
|---|---|---|---|
| T1-1 | Font lewat `@font-face` latin-only yang menunjuk ke berkas woff2 `@fontsource-variable` | Paket menyertakan subset cyrillic/greek/vietnamese yang tidak dibutuhkan | Tambah subset lagi |
| T1-2 | `lang-redirect.js` di `web/public/scripts/` | Satu-satunya cara menyajikan skrip eksternal tanpa hash secara statis (CSP melarang inline) | Pindah satu berkas |
| T1-3 | Halaman `/` adalah pemilih bahasa `noindex`; `x-default` menunjuk halaman Indonesia | Hindari hreflang ke URL yang meredirect; x-default harus ada di sitemap dan timbal balik | `/` tidak ter-index (memang tidak perlu) |
| T1-4 | Redirect bahasa tanpa cookie/penyimpanan (hanya `navigator.language`) | Spec: redirect sekali; hindari urusan consent | Tambah penyimpanan nanti |
| T1-5 | Tes routes-coverage di `web/tests/`, bukan `src/pages/` | Astro menganggap `.ts` di `src/pages/` sebagai endpoint dan build gagal | Tidak ada |
| T1-6 | e2e menyuntikkan CSP dari `_headers` | `astro preview` mengabaikan `_headers`, CSP tidak akan teruji | Tidak ada |
| T1-7 | Skrip `preview` memakai `--ignore-lock` | Lock file preview Astro 7 yang basi membuat webServer Playwright keluar dini | Tidak ada |
| T1-8 | Preset `perf` dibuang dari konfigurasi Lighthouse | Preset itu hanya menjalankan kategori performa, asersi a11y/SEO/BP gagal "auditRan" | Tidak ada |
| T1-9 | WhatsApp sementara `+62 811-1923-888` | Arahan pemilik: boleh nomor mana saja, bisa diedit di admin | Nomor salah sampai diedit |
| T1-10 | Jam operasional placeholder (Senin–Jumat 08.00–17.00 WIB), tidak ditampilkan | Data lama tidak punya; skema mewajibkan | Jam salah bila kelak ditampilkan. **Pemilik wajib konfirmasi.** |

## Keputusan implementasi tahap 2

| # | Keputusan | Alasan | Biaya bila keliru |
|---|---|---|---|
| T2-1 | Konten berupa JSON di `web/content/` yang diimpor statis, bukan Astro content layer | Bisa diuji Vitest tanpa runtime Astro; berkas yang sama akan ditulis admin | Ganti loader |
| T2-2 | ISO 9001 dan ISO 14001 dipublikasikan **tanpa** tahun "2026" dari situs lama | Tahun tampak salah; klaim sertifikasi keliru berisiko hukum dan kredibilitas | Tambah tahun setelah konfirmasi |
| T2-3 | Semua email dimigrasi ke `@promind.co.id` (lama: `promind.id`) | Domain situs dan email cPanel adalah `promind.co.id` | Email ke kotak yang belum ada sampai dikonfirmasi |
| T2-4 | Hero beranda memakai foto lapangan asli, bukan skyline lama | Skyline tampak seperti gambar stok; bertentangan dengan PRODUCT.md | Ganti satu gambar |
| T2-5 | Ringkasan layanan English ditulis ulang mengikuti makna versi Indonesia; slug layanan dipendekkan | English lama menambahkan tagline marketing yang tidak ada di Indonesia | Edit teks |
| T2-6 | Lowongan `hse-officer (Copy)` dibuang | Duplikat di data lama | Tidak ada |
| T2-7 | Blok `home.supporting` dan CTA kedua di hero dibuang | Duplikat isi; aturan satu CTA per section | Tambah bidang lagi |
| T2-8 | Teks baru ditulis di mana situs lama tidak punya (judul portofolio, judul section, SEO title/description) dengan tetap faktual | Dibutuhkan agar halaman lengkap | Edit `pages.json` |
| T2-9 | Gambar OG 1132×593 (1,91:1), bukan 1200×630 | Foto sumber selebar 1132 px dan Astro tidak meng-upscale | Sediakan foto lebih lebar |
| T2-10 | Logo klien (PNG 600 KB) tidak dimigrasi; klien ditampilkan sebagai daftar teks | Izin tampil logo tidak diketahui; hemat byte | Tambah logo setelah izin |
| T2-11 | Hero dan thumbnail memakai crop 4:3 saat build, kualitas 55 | Menurunkan ukuran hero dari 69 KB ke ±24 KB | Foto kurang tajam di layar retina besar |
| T2-12 | Pengecualian LCP 1650 ms hanya untuk dua beranda (`assertMatrix`) | Lantai simulasi ±1,5 dtk untuk halaman dengan foto hero; sisa waktu adalah render delay | Anggaran beranda 150 ms lebih longgar dari spec. **Laporkan ke pemilik.** |
| T2-13 | Label navigasi "Riset" diganti "Wawasan"/"Insights" (slug `riset`/`research` tetap) | Isi halaman memang wawasan dan artikel | Ubah satu teks |
| T2-14 | JSON-LD `JobPosting` memakai lokasi "Jakarta" tetap | Semua lowongan yang dimigrasi di Jakarta | Salah untuk lowongan di luar Jakarta; butuh bidang lokasi terstruktur di admin |
| T2-15 | Rebuild terjadwal harian belum dibuat | Belum ada workflow deploy | Lowongan kedaluwarsa tetap tampil sampai deploy berikutnya. Wajib di tahap 3/4. |
| T2-16 | Axe dijalankan pada semua tingkat dampak dengan nol toleransi, dan aturan label-in-name dihidupkan | Menutup utang tahap 1 | Tes bisa lebih sering merah saat konten baru ditambah |

## Temuan yang diperbaiki lewat review (pola yang perlu diwaspadai)

- Tombol ganti bahasa: nama aksesibel harus memuat teks yang terlihat (WCAG 2.5.3). Sekarang: kode bahasa terlihat plus label sr-only dalam bahasa tujuan.
- Tautan kecil di footer gagal ukuran target 24 px (WCAG 2.2). Semua tautan interaktif memakai `min-h-11`.
- Laporan hasil Lighthouse/Playwright sempat ter-commit. Sudah di-ignore di `web/.gitignore`.
- "Hari ini" untuk kedaluwarsa lowongan sempat tersalin di tiga tempat. Sekarang satu helper (`todayUtc`) dan satu definisi lowongan terbuka.
- Ejaan Inggris Britania ("centre", "multi-storey") dan singkatan "OHS" di situs en-US. Sekarang dijaga tes.
