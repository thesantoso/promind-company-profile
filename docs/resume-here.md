# Lanjut dari sini (titik simpan 2026-10-28)

Dokumen ini untuk sesi baru bila sesi sebelumnya terhenti (mis. batas token). Baca juga `AGENTS.md`, `docs/README.md`, `docs/roadmap.md`, dan `docs/superpowers/plans/2026-10-28-stage3-admin.md`.

## Sudah selesai dan ter-commit
- Tahap 1 dan 2 (situs baru `web/`), tahap 3 backend (`admin/src`): auth + 2FA, user, konten + publish ke Git, upload foto, form kontak, pipeline deploy (`.github/workflows/deploy-*.yml`, `web/wrangler.jsonc`, `admin/wrangler.toml`), `rumahweb/` (PHP mailer, teruji).
- Cloudflare (akun `Pmii.promind@gmail.com`): D1 `promind-admin` sudah dibuat dan di-migrasi; widget Turnstile `promind-contact` dibuat (sitekey publik ada di `deploy-web.yml`); subdomain workers.dev `promind` terdaftar; DNS `forms.promind.co.id` sudah dibuat pemilik (sempat NXDOMAIN, cek ulang).
- GitHub: secret `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sudah terpasang oleh pemilik. Rahasia lokal ada di `~/.promind-secrets.env` (izin 600, tidak pernah di repo): token Cloudflare/GitHub, `ENCRYPTION_KEY`, `CONTACT_HMAC_KEY`, `TURNSTILE_SECRET`, `TURNSTILE_SITEKEY`, `GITHUB_PUBLISH_TOKEN`. Baca dengan parser (format `NAMA = nilai`, ada spasi), jangan `source`, jangan cetak nilainya.

## Dua pekerjaan yang sedang berjalan saat titik simpan ini dibuat (BELUM selesai)
1. **Antarmuka admin** di `admin/ui/**` (React + Vite). Fungsi dan tes e2e sudah ada. Arahan terbaru pemilik: ganti tampilan ke **shadcn/ui** (Radix + Tailwind 4 + Lucide, tema terang/gelap, CSP ketat: jangan pakai `sonner` atau library yang menyuntikkan `<style>`). Perintah: `cd admin && npm run ui:build`, `npm run ui:test`, `npm run ui:e2e`. Stack lokal uji: `cd admin && PORT=8790 npx tsx ui/e2e/stack.ts`.
2. **Pemulihan tampilan situs publik** di `web/` agar **identik** dengan situs live https://promind.co.id/ (acuan: kode di `main` repo lama `../promind-company-profile`, terutama `public/styles-exact.css`, BUKAN branch `backup-stable-state`). Kriteria terukur: selisih piksel per halaman/lebar (1440, 1024, 768, 390), selisih teks nol, tabel semua perbedaan yang disengaja; alat `web/scripts/compare-live.mjs`. Hero skyline, logo klien, angka urut polos, dan pita CTA biru dikembalikan seperti live.
Bila sesi baru memulai, periksa `git status`/`git log` untuk melihat seberapa jauh keduanya, jalankan ulang tesnya, dan lanjutkan (agen baru bisa dibuat dengan arahan di atas).

## Sisa pekerjaan (urut)
1. Selesaikan kedua pekerjaan di atas, jalankan suite penuh (`web`: vitest + playwright + lhci; `admin`: tsc + vitest + ui tes), review akhir.
2. Deploy: `cd admin && npm run ui:build`, isi secret Worker (`wrangler secret put` untuk `ENCRYPTION_KEY`, `GITHUB_TOKEN` (= `GITHUB_PUBLISH_TOKEN`), `CONTACT_HMAC_KEY`, `TURNSTILE_SECRET`; vars `CONTACT_MAILER_URL=https://forms.promind.co.id/contact-mailer.php`, `SITE_ORIGIN` staging), `wrangler deploy` admin dulu (situs punya service binding ke `promind-admin`), lalu `cd web && npm run deploy:staging`. Domain: `admin.promind.co.id` (di `admin/wrangler.toml`) dan `staging.promind.co.id` (di `web/wrangler.jsonc`). Jika DNS/domain ditolak izin, minta pemilik membuatnya di dashboard.
3. Buat undangan Administrator pertama: `rizky` / `rsantoso.me@gmail.com` (`createBootstrapInvite` di `admin/src/auth.ts`, jalankan lewat skrip dengan akses D1 remote); tulis tautannya ke `~/.promind-invite.txt` (chmod 600), jangan ke chat/log.
4. Uji end-to-end di staging (login, ubah teks, Publish, tunggu `version.json`, riwayat/pulihkan), verifikasi widget Turnstile asli di konsol (CSP), upload PHP di `forms.promind.co.id` (lihat `rumahweb/README.md`) dan uji `GET` (405) serta `config.php` (403).
5. Tahap 4 (cutover) hanya setelah pemilik menyetujui staging: `DEPLOY_TARGET=production`, domain `promind.co.id`/`www` (hapus record A/CNAME lama), redirect minimal, pensiun portal PHP. Jangan sentuh MX/TXT/SRV/mail/webmail/cpanel. Proteksi branch `main` setelah pipeline stabil.
6. Perbarui `docs/` (arsitektur admin, panduan editor, keamanan, runbook rotasi token) dan jalankan review akhir.

## Aturan penting dari pemilik
Tampilan situs publik harus sama dengan situs live ("no zero mistake"). Portal admin harus modern (shadcn/ui). Rahasia tidak pernah di chat/repo. Izin sensitif (push, wrangler) sudah diberikan lewat aturan izin pemilik; jika sebuah perintah ditolak pemeriksa izin, jangan disiasati, minta pemilik.
