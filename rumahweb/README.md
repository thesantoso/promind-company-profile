# Endpoint email form kontak (Rumahweb)

Satu berkas PHP kecil yang dipanggil Worker admin untuk mengirim pesan form kontak lewat email cPanel.

## Kenapa subdomain `forms.promind.co.id`

Saat cutover, `promind.co.id` dan `www` pindah ke Cloudflare Workers, sehingga folder `public_html` di Rumahweb tidak lagi terjangkau lewat domain utama. Endpoint ini butuh hostname sendiri yang tetap menunjuk ke Rumahweb: `forms.promind.co.id`. Rekor DNS-nya dibuat otomatis oleh gue (A, lewat proxy Cloudflare, ke IP Rumahweb yang sama dengan domain lama).

## Pasang (sekali, di cPanel)

1. cPanel -> **Domains** (atau Subdomains) -> buat subdomain `forms.promind.co.id` dengan *document root* `public_html/forms`.
2. Unggah `contact-mailer.php` dan `.htaccess` dari folder ini ke `public_html/forms/`.
3. Di folder itu buat `contact-mailer.config.php` (salin dari `contact-mailer.config.example.php`) lalu isi `hmac_key` dengan nilai `CONTACT_HMAC_KEY` dari `~/.promind-secrets.env` (jangan tulis di repo atau chat). `from` harus alamat di domain `promind.co.id` (agar lolos SPF), `to` adalah kotak masuk tujuan (mis. `corporate@promind.co.id`, pastikan kotak itu ada).
4. Uji: `curl -i https://forms.promind.co.id/contact-mailer.php` harus `405` (hanya POST), dan `https://forms.promind.co.id/contact-mailer.config.php` harus `403`.

## Keamanan

- Hanya menerima POST dengan tanda tangan `HMAC-SHA256("<X-Timestamp>.<badan>")` dan stempel waktu maksimal 5 menit; perbandingan waktu-konstan (`hash_equals`).
- Semua kolom satu-baris menolak karakter kontrol/CR/LF (tanpa injeksi header email); `Reply-To` berisi alamat pengirim, `From` selalu domain sendiri.
- Tidak ada pesan error yang membocorkan isi konfigurasi. Kegagalan dicatat lewat `error_log`.
