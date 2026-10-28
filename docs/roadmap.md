# Roadmap

## Tindakan pemilik (diperlukan, bukan kode)

| # | Tindakan | Kenapa |
|---|---|---|
| 1 | **Ganti password admin portal lama** (`portal.promind.co.id`). Password default pernah tertulis di `HANDOVER.md` dan ada di riwayat Git. | Kredensial produksi bocor di repo |
| 2 | Konfirmasi item di [../web/content/REVIEW.md](../web/content/REVIEW.md): tahun ISO 9001/14001, bukti sertifikasi, domain email, "didirikan 2013", izin menampilkan nama klien, tanggal berakhir lowongan, nama resmi "Training Centre/Center", logo tanpa teks alamat. | Menghindari klaim keliru di situs publik |
| 3 | Konfirmasi jam operasional dan nomor WhatsApp yang benar | Saat ini placeholder |
| 4 | Review nada dan istilah teknis teks English (en-US) | Kualitas native tidak bisa dinilai mesin |
| 5 | Siapkan akses untuk tahap 3 dan 4 (daftar di bawah) | Tanpa itu admin dan deploy tidak bisa dibuat |
| 6 | Putuskan apakah branch `revamp` di-push ke GitHub (CI belum pernah jalan) | Push dari agent sempat diblokir; pemilik yang menjalankan `git push -u origin revamp` atau menambah aturan izin |

## Tahap 3 — Portal admin

Rencana implementasi belum ditulis. Cakupan menurut [spec](superpowers/specs/2026-10-28-promind-revamp-design.md) bagian 4, 7, 10:

- Worker (Hono) + SPA React di `admin.promind.co.id`; D1 untuk user, sesi, draft, log audit.
- Autentikasi: hash password kuat (WebCrypto), 2FA TOTP wajib, pembatasan percobaan login, sesi singkat, CSRF, CSP ketat. Dua peran: admin dan editor.
- Editor dua kolom ID | EN dengan status terjemahan; gate publikasi memakai skema yang sama dengan situs (`src/content/schema.ts` dipakai ulang).
- Upload gambar dikompres di browser, alt text dua bahasa wajib, disimpan ke Git.
- Publish = commit ke repo lewat GitHub API → Actions build → deploy → purge cache → ping IndexNow. Status build ditampilkan. Riwayat dan tombol kembalikan dari Git.
- Form kontak: Worker → endpoint PHP kecil di Rumahweb (Turnstile + HMAC). Perlu memperbarui CSP untuk Turnstile.
- Bidang lokasi terstruktur untuk lowongan (kota dan wilayah) agar JSON-LD tidak lagi memaksa "Jakarta".
- Rebuild terjadwal harian (cron GitHub Actions atau deploy hook) supaya lowongan kedaluwarsa hilang otomatis.

Akses yang dibutuhkan: akun Cloudflare (verifikasi bahwa Workers, D1, KV, dan Turnstile aktif **tanpa kartu**), fine-grained GitHub token untuk satu repo dengan izin konten, secret untuk HMAC form kontak, akses cPanel untuk endpoint PHP. Token dan secret tidak pernah ditulis di repo.

## Tahap 4 — Hardening dan cutover

- Workflow deploy ke Cloudflare (Workers static assets), `SITE_URL` wajib diisi untuk staging dan produksi.
- Situs baru di `staging.promind.co.id` paralel dengan situs lama.
- Peta redirect 301 dari URL lama (path bersih dan hash `#/`) ke URL baru.
- Pastikan `_headers` (CSP dan lainnya) benar-benar diterapkan di host, dan ukur ulang Lighthouse serta data lapangan (LCP beranda).
- Cutover dengan mengganti DNS (record web saja; MX tetap). Rollback juga lewat DNS.
- Pensiunkan portal PHP dan `deploy.yml` lama setelah situs baru stabil. Hapus `public/portal` dan sisa Vite SPA dari repo.

## Utang teknis (minor) yang ditunda

Dari review tahap 1:

- Halaman `/` memuat `noindex` sekaligus canonical/hreflang (sinyal campur). Cukup `noindex, follow`.
- Tes menu mobile baru menguji Enter (belum Space atau urutan Tab); tes reduced motion baru memeriksa `scroll-behavior`.
- Tahun di footer dibekukan saat build.
- Halaman 404 ber-`lang="en"` dengan teks Indonesia (bungkus teks Indonesia dengan `lang="id"`).
- `--color-body-alt` belum dipakai. CI membangun tiga kali (beforeAll vitest, webServer Playwright, langkah build eksplisit).

Dari review tahap 2:

- `findBrandViolations` meloloskan `Selesai.Promind` dan `PROMIND/ProMind`, dan hanya memindai `content/*.json` (belum `ui.ts`, komponen, dan teks `llms.txt`).
- `PlaceholderPage.astro` sudah tidak terpakai. Buat dispatch route eksaustif agar route baru yang belum punya halaman gagal build.
- JSON-LD organisasi memakai alamat sebagai satu `streetAddress`; tambahkan `addressLocality` dan `addressRegion`.
- `jobSchema` belum memeriksa `postedAt <= validThrough`.
- `lighthouserc.json` mengaudit `/id/karir/building-manager/`; jika lowongan itu dinonaktifkan, CI gagal karena 404. Turunkan URL dari lowongan aktif pertama.
- Bagian FAQ jawaban-dulu untuk GEO belum ada karena membutuhkan konten baru dari pemilik.
- Salary tidak dicantumkan di lowongan (Google for Jobs lebih menyukai kisaran gaji).

## Pertanyaan terbuka

- Apakah ada FAQ atau studi kasus nyata yang boleh dipublikasikan untuk GEO?
- Apakah logo klien boleh ditampilkan (dan ada berkas yang layak)?
- Apakah perlu bahasa lain selain Indonesia dan English (US)?
