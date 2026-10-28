# Konten yang perlu dikonfirmasi pemilik

Dimigrasi dari situs lama tanpa mengubah faktanya. Item di bawah ini meragukan dan tidak dikoreksi sendiri.

## Standar dan sertifikasi (`standards.json`)

- Situs lama menulis `ISO 9001 : 2026` dan `ISO 14001 : 2026`. Revisi terbaru kedua standar itu bukan 2026, jadi tahunnya **tidak dipublikasikan**: kodenya kini `ISO 9001` dan `ISO 14001`. Mohon konfirmasi sertifikat dan tahun yang benar.
- `ISO 45001:2018` dan SMK3 (PP No. 50 Tahun 2012) dipertahankan.
- Bukti sertifikasi (lembaga penerbit, masa berlaku) belum ada di data. Tanpa itu, klaim sebaiknya tidak ditampilkan menonjol.

## Domain email

- Konten lama memakai `corporate@promind.id` dan `recruitment@promind.id`, sedangkan domain situs dan email cPanel adalah `promind.co.id`. Semua email dimigrasi ke `@promind.co.id`. Mohon pastikan kotak masuk `corporate@` dan `recruitment@` ada di domain itu.

## Klaim yang tidak punya bukti di repo

- "Didirikan pada tahun 2013" (halaman Tentang Kami).
- Daftar klien dan portofolio (12 proyek, 14 klien): dimigrasi apa adanya. Pastikan izin menampilkan nama klien.
- Foto hero lama (skyline) tampak seperti gambar stok. Beranda baru memakai foto lapangan PROMIND.

## English

- Teks English ditulis ulang agar natural (en-US). Mohon review nada dan istilah teknis sebelum rilis.

## Lowongan (`careers.json`)

- Lowongan `hse-officer` ada dua di data lama (satu berjudul "(Copy)"). Hanya satu yang dimigrasi.
- Tanggal terbit semua lowongan 2026-10-17 (dari data lama) dan tidak ada tanggal berakhir. Mohon isi `validThrough` bila ada, dan nonaktifkan lowongan yang sudah ditutup. Google for Jobs menampilkan lowongan yang kadaluarsa sebagai masalah.
- Gaji tidak dicantumkan. Google for Jobs lebih menyukai kisaran gaji bila ada.

## Logo

- Berkas logo header (`promind-header-brand.png`) memuat teks alamat kecil di sebelah logo. Di lebar 176 px teks itu tidak terbaca dan terlihat seperti noda. Sebaiknya sediakan versi logo tanpa teks alamat (lambang dan nama saja).

## Penamaan layanan

- "Property Management Training Centre" ditulis "Training Center" di sisi English (en-US) dan tetap "Training Centre" di sisi Indonesia. Bila nama resmi unit ini memang "Centre", beri tahu agar sisi English disamakan.
- Istilah K3 di teks English ditulis lengkap ("occupational health and safety") agar jelas bagi pembaca AS, dengan "(K3)" dan "(Ahli K3 Umum)" dipertahankan.

## Nama PROAPPS

- Keputusan pemilik: "PROAPPS" **tidak tampil** di situs publik. Kata itu dihapus dari teks Wawasan dan lowongan (diganti "sistem manajemen gedung" atau dihilangkan). Aturan ini ditegakkan oleh tes konten dan oleh validasi portal admin.
