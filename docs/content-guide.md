# Panduan Konten

Sampai portal admin (tahap 3) selesai, konten diubah langsung lewat file JSON di `web/content/`. Panduan ini juga menjadi spesifikasi perilaku yang nanti harus dipenuhi admin.

## Alur mengubah konten

1. Edit file JSON yang relevan di `web/content/`.
2. Jalankan `cd web && npx vitest run`. Tes konten memeriksa semua aturan di bawah dan gagal dengan pesan yang menyebut entri dan bidangnya.
3. Jalankan `npm run build` untuk memastikan build tetap berhasil.
4. Commit. (Setelah tahap 4, push ke `main` memicu build dan deploy.)

## Aturan dua bahasa

- Setiap teks punya `id` dan `en`. Keduanya wajib terisi dan tidak boleh hanya spasi.
- Daftar (deliverables, tanggung jawab, kualifikasi, benefit, highlights) berbentuk `{ "id": [...], "en": [...] }` dan **harus sama panjang**: butir ke-n di `id` adalah padanan butir ke-n di `en`.
- English ditulis sebagai konten sendiri dalam **ejaan en-US**, bukan terjemahan harfiah. Gunakan "center" bukan "centre", "multi-story" bukan "multi-storey". Tes memindai semua teks `en` untuk ejaan Britania.
- Singkatan lokal dijelaskan untuk pembaca AS: tulis "occupational health and safety (K3)" alih-alih "OHS". Istilah resmi Indonesia (PPPSRS, SLF, BPJS) boleh tetap, dengan penjelasan bila perlu.
- Teks Indonesia boleh mempertahankan istilah industri berbahasa Inggris (Office Building, Property Management, Tenant Relations) sesuai kebiasaan situs lama.

## Aturan brand

- `PROMIND` dan `PROAPPS` selalu huruf kapital penuh di teks. Email dan hostname (`corporate@promind.co.id`) tetap huruf kecil.
- Dilarang badge atau nomor kotak (`01`, `02`). Tes menolak kunci `num`. Daftar poin memakai bullet `•` (komponen `BulletList`).
- Satu ajakan bertindak (CTA) per halaman atau section.
- Jangan mengarang klaim: angka, sertifikasi, nama klien, atau pencapaian harus datang dari pemilik. Data yang meragukan dicatat di [../web/content/REVIEW.md](../web/content/REVIEW.md).
- Eyebrow (label kecil di atas judul) ditulis huruf biasa di data. Huruf kapital diterapkan oleh CSS.

## Format per koleksi

Semua koleksi punya skema di `web/src/content/schema.ts`. Ringkasnya:

- **services, pillars, engagement, property-types, fieldwork, insights**: `slug` (huruf kecil, angka, tanda hubung, unik), `title`, `summary` (dan `deliverables`, `detail`, `category`, `highlights` sesuai koleksi).
- **fieldwork**: `image: { src: "nama-file.jpg", alt: { id, en } }`. File harus ada di `web/src/assets/photos/`. Alt text wajib dan bermakna di kedua bahasa (jelaskan apa yang terlihat di foto).
- **standards**: `code` (bukan bilingual) dan `name`.
- **portfolio**: `name` (nama proyek, bukan bilingual), `sector`, `scope`, `location`. Proyek dikelompokkan di halaman berdasarkan `sector.en`.
- **clients**: `name` dan `category`.
- **pages.json**: teks halaman dan `seo` (title harus memuat `PROMIND`; description 70–170 karakter di kedua bahasa).

## Menambah atau menutup lowongan

Tambah objek baru di `careers.json`:

```json
{
  "slug": "senior-technician",
  "title": { "id": "...", "en": "..." },
  "department": { "id": "...", "en": "..." },
  "type": { "id": "Full-Time", "en": "Full-time" },
  "experience": { "id": "...", "en": "..." },
  "location": { "id": "...", "en": "..." },
  "summary": { "id": "...", "en": "..." },
  "responsibilities": { "id": ["..."], "en": ["..."] },
  "qualifications": { "id": ["..."], "en": ["..."] },
  "benefits": { "id": ["..."], "en": ["..."] },
  "applicationEmail": "recruitment@promind.co.id",
  "postedAt": "2026-11-01",
  "validThrough": "2026-12-31",
  "active": true
}
```

- `slug` sama untuk kedua bahasa dan dipakai di URL (`/id/karir/senior-technician/`, `/en/careers/senior-technician/`). Slug duplikat menggagalkan build.
- `postedAt` dan `validThrough` hanya tanggal (`YYYY-MM-DD`). `validThrough` boleh dikosongkan. Lowongan terbuka sampai akhir hari itu (UTC).
- `type.en` dipetakan ke tipe kerja Google (`Full-time` → `FULL_TIME`, `Part-time`, `Contract`, `Internship`, `Temporary`). Nilai lain jadi `OTHER`.
- Menutup lowongan: set `"active": false` atau isi `validThrough`, lalu deploy ulang. Halaman, daftar, sitemap, dan JSON-LD-nya hilang bersamaan.
- Saat ini lokasi di JSON-LD selalu "Jakarta". Lowongan di luar Jakarta butuh bidang lokasi terstruktur (lihat [roadmap](roadmap.md)).

## Menambah foto

1. Taruh file JPG di `web/src/assets/photos/` (nama huruf kecil dengan tanda hubung).
2. Rujuk dari JSON (`fieldwork.json`) dengan nama berkas, lengkap dengan alt text dua bahasa.
3. Foto portrait atau landscape sama-sama bisa. Komponen `Photo` membuat crop dan varian AVIF saat build. Foto sumber sebaiknya lebar ≥ 1200 px (Astro tidak melakukan upscale).
