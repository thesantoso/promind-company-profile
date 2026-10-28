# Endpoint email form kontak (Rumahweb)

Satu berkas PHP kecil yang dipanggil Worker admin untuk mengirim pesan form kontak lewat email cPanel.

## Pasang (sekali)

1. Di cPanel, buat folder `public_html/mail/` (nama bebas, tapi URL-nya dipakai di `CONTACT_MAILER_URL`).
2. Unggah `contact-mailer.php` dan `.htaccess` dari folder ini ke sana.
3. Salin `contact-mailer.config.example.php` menjadi `contact-mailer.config.php` **di server**, lalu isi `hmac_key` dengan string acak minimal 32 karakter (sama persis dengan secret Worker `CONTACT_HMAC_KEY`; jangan tulis di repo atau chat). Pastikan `from` adalah alamat di domain `promind.co.id` (agar lolos SPF) dan `to` adalah kotak masuk tujuan.
4. Uji: `curl -i https://promind.co.id/mail/contact-mailer.php` harus membalas `405` (hanya POST), dan `https://promind.co.id/mail/contact-mailer.config.php` harus `403`.

## Keamanan

- Hanya menerima POST dengan tanda tangan `HMAC-SHA256("<X-Timestamp>.<badan>")` dan stempel waktu maksimal 5 menit; perbandingan waktu-konstan (`hash_equals`).
- Semua kolom satu-baris menolak karakter kontrol/CR/LF (tanpa injeksi header email); `Reply-To` berisi alamat pengirim, `From` selalu domain sendiri.
- Tidak ada pesan error yang membocorkan isi konfigurasi. Kegagalan dicatat lewat `error_log`.
