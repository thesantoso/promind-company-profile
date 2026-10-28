# PROMIND Revamp — Tahap 3: Portal Admin (+ pipeline deploy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; owner chose to run all plans). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Portal admin di `admin.promind.co.id` tempat tim non-teknis mengatur konten dua bahasa situs, dengan login aman (password + 2FA), manajemen user oleh Administrator, publish ke Git, riwayat/rollback, upload gambar, form kontak, dan pipeline deploy otomatis.

**Architecture:** Satu Cloudflare Worker (`admin/`, Hono + TypeScript) melayani API dan SPA React (static assets). D1 menyimpan user, sesi, undangan, draft, gambar draft, percobaan login, dan log audit. Sumber kebenaran konten terbit adalah Git: Worker membaca dan menulis `web/content/*.json` dan foto lewat GitHub Git Data API (satu commit atomik per Publish). Skema Zod dipakai bersama dengan situs (`web/src/content/schema.ts`), jadi admin tidak bisa menyimpan data yang akan menggagalkan build. GitHub Actions membangun dan men-deploy situs ke Cloudflare (Workers static assets).

**Tech Stack:** Hono, Zod 4, Cloudflare Workers + D1 + Turnstile, WebCrypto (PBKDF2, AES-GCM, HMAC), React 19 + Vite (SPA), Vitest (D1 diuji dengan `node:sqlite`), Playwright, Wrangler 4.

**Spec:** `docs/superpowers/specs/2026-10-28-promind-revamp-design.md` (bagian 2, 4, 7). Tahap sebelumnya: stage 1 dan 2.

## Keputusan pemilik yang berlaku

- Administrator pertama: **rizky**, `rsantoso.me@gmail.com`. Administrator harus bisa **menambah, mengedit, menonaktifkan user** dan mereset 2FA dari portal.
- Hanya layanan Cloudflare gratis tanpa kartu (terbukti: D1, Worker, Turnstile bisa dibuat). Hosting situs di Cloudflare. Email tetap di Rumahweb.
- Domain: `admin.promind.co.id` (portal), `staging.promind.co.id` (situs baru), `promind.co.id` + `www` saat cutover (tahap 4). Tidak pernah menyentuh MX.
- Proteksi branch `main` ditunda, dilakukan setelah pipeline stabil.
- Rahasia hanya di `~/.promind-secrets.env` (di luar repo) dan sebagai secret Cloudflare/GitHub. Tidak pernah di repo, log, dokumen, atau chat.

## Global Constraints

- Semua batasan tahap 1 dan 2 tetap berlaku (palet, font, header putih solid pada situs, brand, TDD, tanpa melemahkan standar mutu).
- **Keamanan admin:** password di-hash PBKDF2-SHA256 (jumlah iterasi ditetapkan oleh uji CPU di Task 0), 2FA TOTP wajib, rate limit login, cookie `__Host-` `HttpOnly` `Secure` `SameSite=Strict`, CSRF token + cek `Origin` pada setiap mutasi, CSP ketat pada SPA (tanpa inline script), semua input divalidasi Zod di server, rahasia TOTP terenkripsi AES-GCM, token sesi hanya disimpan sebagai hash, pesan error login seragam (tidak membocorkan keberadaan akun).
- Tidak ada pendaftaran publik: user hanya dibuat lewat undangan satu-kali yang kedaluwarsa dalam 72 jam.
- Setiap perubahan konten, user, dan login tercatat di `audit_log`.
- Tidak boleh ada Administrator nol: administrator terakhir tidak bisa dinonaktifkan atau diturunkan.
- Batas Workers gratis: CPU 10 ms per request (periksa angka aktual di Task 0), 100 ribu request per hari.

## Review Focus

1. Login dengan password benar tapi TOTP salah/kosong tidak boleh membuat sesi; percobaan ke-6 dalam 15 menit ditolak walau kredensial benar (Task 3).
2. Undangan kedaluwarsa, sudah dipakai, atau token salah tidak boleh membuat akun; token tidak tersimpan plaintext (Task 3).
3. Editor tidak boleh mengakses endpoint user management; administrator terakhir tidak bisa dinonaktifkan atau diturunkan oleh siapa pun, termasuk dirinya (Task 4).
4. Mutasi tanpa CSRF token valid atau dengan `Origin` asing ditolak; sesi yang kedaluwarsa atau di-revoke langsung ditolak (Task 3).
5. Draft yang memuat `en` kosong, slug ganda, "Promind" salah huruf, atau ejaan Britania tidak bisa dipublikasikan; publish ditolak bila file di Git sudah berubah sejak draft dibuat (Task 5).
6. Upload bukan gambar (ekstensi dipalsukan), terlalu besar, atau nama berkas berbahaya (`../`) ditolak (Task 6).
7. Form kontak: Turnstile gagal, honeypot terisi, atau tanda tangan HMAC/stempel waktu salah tidak boleh mengirim email (Task 7).

## File Structure

```
admin/
  package.json tsconfig.json vitest.config.ts wrangler.toml
  migrations/0001_init.sql
  src/worker.ts env.ts db.ts crypto.ts totp.ts auth.ts users.ts github.ts content.ts publish.ts images.ts contact.ts
  src/routes/{auth,users,content,images,contact}.ts
  test/support/d1.ts (adapter node:sqlite) test/*.test.ts
  ui/ (React SPA, Vite)  ->  ui/dist (dilayani sebagai static assets)
web/src/content/rules.ts       (aturan konten bersama: brand, ejaan US, slug unik)
rumahweb/contact-mailer.php    (endpoint pengirim email)
.github/workflows/deploy-web.yml deploy-admin.yml
```

---

### Task 0: Spike — batas CPU Workers gratis untuk hashing

**Files:** Create (sementara, tidak di-commit) probe Worker di scratchpad.

- [ ] **Step 1:** Deploy Worker probe `promind-probe` yang menjalankan PBKDF2-SHA256 dengan N iterasi pada `POST /?n=<N>` dan mengembalikan waktu jam-dinding. Gunakan N = 100_000, 210_000, 310_000, 600_000.
- [ ] **Step 2:** Panggil tiap N beberapa kali (beberapa isolate berbeda). Catat apakah ada error 1102 (CPU limit) atau 503/500.
- [ ] **Step 3:** Pilih N tertinggi yang lolos stabil (10 dari 10 panggilan). Catat N, hasil, dan alasan di ledger dan `docs/decisions.md`. Hapus Worker probe.
- **Expected:** keputusan angka iterasi yang konstan `PBKDF2_ITERATIONS` dipakai di Task 2. Bila bahkan 100_000 gagal, hentikan dan laporkan ke pemilik (alternatif: Argon2 via WASM tidak mungkin di batas ini; opsi lain dibahas dengan pemilik).

### Task 1: Scaffold `admin/`, migrasi D1, adapter tes SQLite

**Files:** Create `admin/package.json`, `tsconfig.json`, `vitest.config.ts`, `wrangler.toml`, `migrations/0001_init.sql`, `src/env.ts`, `src/db.ts`, `test/support/d1.ts`, `test/migrations.test.ts`.

**Interfaces:**
- Produces: `type Env = { DB: D1Database; ASSETS: Fetcher; ENCRYPTION_KEY: string; GITHUB_TOKEN: string; GITHUB_REPO: string; GITHUB_BRANCH: string; ADMIN_ORIGIN: string; SITE_ORIGIN: string; CONTACT_HMAC_KEY: string; CONTACT_MAILER_URL: string; TURNSTILE_SECRET: string }`; `createTestDb(): D1Database` (in-memory `node:sqlite` dengan semua migrasi diterapkan, API `prepare().bind().first()/all()/run()` dan `batch()`), `nowSec(): number`.
- Tabel: `users(id, email UNIQUE, name, role CHECK in ('administrator','editor'), password_hash, totp_secret_enc, totp_confirmed INTEGER, active INTEGER, created_at, last_login_at)`, `invites(id, token_hash UNIQUE, email, name, role, created_by, expires_at, used_at)`, `sessions(id, token_hash UNIQUE, user_id, csrf_token, created_at, last_seen_at, expires_at, revoked_at)`, `login_attempts(id, key, ts)`, `recovery_codes(id, user_id, code_hash, used_at)`, `drafts(key PRIMARY KEY, data, base_sha, updated_by, updated_at)`, `draft_images(path PRIMARY KEY, mime, data BLOB, created_by, created_at)`, `audit_log(id, ts, user_id, action, detail)`.

- [ ] **Step 1: Failing test** `migrations.test.ts`: semua tabel di atas ada; `INSERT` user dengan `role='owner'` ditolak oleh CHECK; email duplikat ditolak.
- [ ] **Step 2:** Jalankan → FAIL. **Step 3:** Tulis migrasi dan adapter. **Step 4:** PASS. **Step 5: Commit.**

### Task 2: Kripto: hash password, token, enkripsi, TOTP

**Files:** Create `admin/src/crypto.ts`, `admin/src/totp.ts`, `admin/test/crypto.test.ts`, `admin/test/totp.test.ts`.

**Interfaces:**
- `PBKDF2_ITERATIONS` (dari Task 0); `hashPassword(pw: string): Promise<string>` → `pbkdf2$<iter>$<saltB64>$<hashB64>`; `verifyPassword(pw: string, stored: string): Promise<boolean>` (waktu-konstan, menolak format tak dikenal); `randomToken(bytes = 32): string` (base64url); `sha256Hex(s: string): Promise<string>`; `encryptSecret(plain: string, keyB64: string): Promise<string>` / `decryptSecret(blob: string, keyB64: string): Promise<string>` (AES-GCM, IV acak, gagal bila dirusak); `timingSafeEqual(a: string, b: string): boolean`.
- `generateTotpSecret(): string` (Base32, 20 byte); `totpCode(secretBase32: string, atMs: number): Promise<string>`; `verifyTotp(secretBase32: string, code: string, atMs: number, window = 1): Promise<boolean>`; `otpauthUri(email: string, secret: string): string`.

- [ ] **Step 1: Failing tests:** vektor RFC 6238 (secret `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`, waktu 59 s → `94287082` untuk 8 digit; uji varian 6 digit dengan nilai yang diturunkan dari vektor yang sama) ; kode dari jendela ±1 diterima, ±2 ditolak; kode non-digit, panjang salah, dan kosong ditolak; `verifyPassword` benar/salah/format rusak; hash dua kali untuk password sama berbeda (salt acak); enkripsi bolak-balik berhasil dan satu byte dirusak membuat dekripsi gagal; `timingSafeEqual` panjang berbeda → false.
- [ ] **Step 2:** FAIL. **Step 3:** Implementasi dengan WebCrypto saja (tanpa dependensi). **Step 4:** PASS. **Step 5: Commit.**

### Task 3: Layanan autentikasi, sesi, undangan, rate limit, CSRF

**Files:** Create `admin/src/auth.ts`, `admin/src/routes/auth.ts`, `admin/test/auth.test.ts`.

**Interfaces:**
- `createInvite(db, by: User, input: {email, name, role}): Promise<{token: string; expiresAt: number}>` (hanya `administrator`; token acak, hanya hash yang disimpan, kedaluwarsa 72 jam); `acceptInvite(db, env, token, password): Promise<{user: User; totpSecret: string; otpauth: string}>` (password minimal 12 karakter, tidak boleh sama dengan email/nama; user dibuat dengan `totp_confirmed=0`); `confirmTotpEnrollment(db, env, userId, code): Promise<{recoveryCodes: string[]}>` (8 kode sekali pakai, hanya hash disimpan); `login(db, env, input: {email, password, totp?: string, recoveryCode?: string}, ctx: {ip: string}): Promise<{token: string; csrf: string; user: User}>`; `getSession(db, token): Promise<{user, csrf} | null>` (menolak kedaluwarsa, revoked, user nonaktif; idle 2 jam, absolut 12 jam); `logout`, `revokeAllSessions(db, userId)`; `changePassword`.
- Routes (Hono, prefiks `/api`): `POST /auth/invite/accept`, `POST /auth/totp/confirm`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`, `POST /auth/password`. Middleware `requireSession`, `requireRole('administrator')`, `csrfAndOrigin` (mutasi harus membawa `X-CSRF-Token` yang sama dengan sesi dan `Origin` = `ADMIN_ORIGIN`). Cookie `__Host-promind_session`.
- Rate limit: kunci `email|ip`; maksimal 5 percobaan gagal per 15 menit → 429 dengan `Retry-After`.

- [ ] **Step 1: Failing tests (Review Focus 1, 2, 4):** login sukses; password benar + TOTP salah → 401 dan tidak ada sesi; TOTP kosong → 401; percobaan ke-6 gagal dalam 15 menit → 429 walau kredensial benar; pesan error sama untuk email tak dikenal dan password salah; undangan kedaluwarsa/dipakai/token salah → ditolak dan tak ada user; token undangan dan sesi tidak ada plaintext di DB (cari di semua kolom); `getSession` menolak sesi expired/revoked/idle dan user nonaktif; mutasi tanpa CSRF atau dengan `Origin` asing → 403; kode pemulihan bekerja sekali lalu ditolak; password < 12 karakter ditolak.
- [ ] **Step 2:** FAIL. **Step 3:** Implementasi (jam bisa disuntik untuk tes). **Step 4:** PASS. **Step 5: Commit.**

### Task 4: Manajemen user (Administrator)

**Files:** Create `admin/src/users.ts`, `admin/src/routes/users.ts`, `admin/test/users.test.ts`.

**Interfaces:** `listUsers`, `updateUser(db, actor, id, {name?, role?, active?})`, `resetTwoFactor(db, actor, id)` (hapus rahasia TOTP dan kode pemulihan, cabut sesi; user wajib enroll ulang pada login berikutnya lewat undangan baru), `revokeUserSessions`, `createInvite` (dari Task 3), `writeAudit(db, userId, action, detail)`. Routes: `GET /users`, `POST /users/invite`, `PATCH /users/:id`, `POST /users/:id/reset-2fa`, `POST /users/:id/revoke-sessions`, `GET /audit` (admin saja, paginasi).

- [ ] **Step 1: Failing tests (Review Focus 3):** editor mendapat 403 di semua route `/users*` dan `/audit`; administrator terakhir tidak bisa dinonaktifkan atau diturunkan (error jelas) baik oleh dirinya maupun administrator lain yang sedang dinonaktifkan; dengan dua administrator, satu boleh diturunkan; nonaktifkan user mencabut semua sesinya; setiap aksi menulis `audit_log`; email undangan yang sudah terdaftar ditolak; role selain dua yang valid ditolak.
- [ ] **Step 2–5:** FAIL, implementasi, PASS, commit.

### Task 5: Konten: aturan bersama, klien GitHub, draft, publish, riwayat

**Files:** Create `web/src/content/rules.ts` (+ tes), `admin/src/content.ts`, `admin/src/github.ts`, `admin/src/publish.ts`, `admin/src/routes/content.ts`, `admin/test/content.test.ts`, `admin/test/publish.test.ts`; Modify `web/src/content/content.test.ts` (pakai `rules.ts`).

**Interfaces:**
- `rules.ts`: `findBritishSpelling(text: string): string[]` (daftar kata dari tes tahap 2), `englishStrings(value): string[]`; dipakai situs dan admin.
- `content.ts`: `CONTENT_FILES: Record<ContentKey, {path: string; kind: 'object' | 'array'; schema: ZodType}>` untuk 12 berkas (`settings`, `pages`, `services`, `property-types`, `pillars`, `fieldwork`, `engagement`, `standards`, `portfolio`, `clients`, `insights`, `careers`); `validateContent(key, data): {ok: true} | {ok: false; issues: {path: string; message: string}[]}` (skema Zod, slug unik, `findBrandViolations`, `findBritishSpelling` pada semua teks `en`, foto yang dirujuk `fieldwork.image.src` harus ada di repo atau draft_images).
- `github.ts`: `class GitHub { constructor(env, fetchImpl = fetch) ; getFile(path): Promise<{content: string; sha: string}>; getBranchHead(): Promise<string>; commitFiles(files: {path: string; content: string | Uint8Array}[], message: string, expectedHead?: string): Promise<{sha: string}>; listCommits(path, limit): Promise<{sha, message, author, date}[]>; getFileAt(path, sha): Promise<string> }` (Git Data API: blob → tree → commit → update ref; 422/409 pada update ref menjadi `ConflictError`).
- `publish.ts`: `saveDraft(db, gh, user, key, data): Promise<{issues}>` (menyimpan draft dengan `base_sha` blob saat ini, mengembalikan isu validasi); `discardDraft`; `publish(db, gh, user, keys: ContentKey[], message?): Promise<{commit: string}>` (validasi ulang semua; tolak bila blob di Git ≠ `base_sha`; JSON diserialisasi 2 spasi + newline; sertakan `draft_images`; hapus draft dan gambar setelah sukses; tulis audit); `restoreVersion(db, gh, user, key, sha)` (membuat commit baru berisi isi berkas pada `sha`, lewat `validateContent`).
- Routes: `GET /content` (daftar kunci + status draft), `GET /content/:key` (isi saat ini dan draft), `PUT /content/:key` (simpan draft, kembalikan isu), `DELETE /content/:key/draft`, `POST /publish`, `GET /content/:key/history`, `POST /content/:key/restore`. Editor dan administrator boleh; `settings` boleh keduanya.
- Build situs menulis `dist/version.json` `{ "commit": "<GITHUB_SHA>", "builtAt": "<ISO>" }` (Task 9) agar UI bisa memantau kapan versi baru live tanpa izin tambahan.

- [ ] **Step 1: Failing tests (Review Focus 5):** `validateContent` menolak: `en` kosong, daftar tak sama panjang, slug ganda (dua `hse-officer`), "Promind" salah huruf, "centre"/"multi-storey", foto yang tidak ada; menerima seluruh `web/content/*.json` apa adanya (data nyata); `commitFiles` dengan fetch palsu mengirim urutan blob→tree→commit→ref yang benar dan `base_tree`; ref update 422 → `ConflictError`; `publish` menolak bila blob di Git berubah sejak draft; `publish` menulis JSON identik dengan format berkas yang ada (round-trip data nyata menghasilkan byte yang sama); draft dan gambar dihapus setelah sukses; `restoreVersion` membuat commit baru, bukan mengubah riwayat.
- [ ] **Step 2–5:** FAIL, implementasi, PASS, commit.

### Task 6: Upload gambar

**Files:** Create `admin/src/images.ts`, `admin/src/routes/images.ts`, `admin/test/images.test.ts`.

**Interfaces:** `saveDraftImage(db, user, filename: string, bytes: Uint8Array): Promise<{path: string; name: string}>` → simpan sebagai `web/src/assets/photos/<name>.jpg`; hanya JPEG (magic bytes `FFD8FF`), ukuran ≤ 1.5 MB, lebar ≥ 800 px (baca SOF), nama dinormalisasi `^[a-z0-9-]+\.jpg$` dan ditolak bila menimpa foto yang ada di Git tanpa `overwrite=true`. Route `POST /images` (multipart) dan `GET /images/:name` (draft saja).

- [ ] **Step 1: Failing tests (Review Focus 6):** PNG berekstensi `.jpg` ditolak; file > 1.5 MB ditolak; nama `../../x.jpg`, `A B.jpg`, `x.php.jpg` dinormalisasi atau ditolak sesuai aturan; lebar < 800 ditolak; JPEG valid diterima dan tersimpan sebagai BLOB.
- [ ] **Step 2–5:** FAIL, implementasi, PASS, commit.

### Task 7: Form kontak (Turnstile + HMAC → endpoint PHP Rumahweb)

**Files:** Create `admin/src/contact.ts`, `admin/src/routes/contact.ts`, `admin/test/contact.test.ts`, `rumahweb/contact-mailer.php`, `rumahweb/README.md`; Modify `web/` (komponen form, `public/_headers` untuk Turnstile), `web/tests/e2e`.

**Interfaces:** `POST /api/contact` (publik, CORS hanya `SITE_ORIGIN`): body `{name, email, phone?, topic, message, lang, turnstileToken, website}` (`website` = honeypot). `verifyTurnstile(secret, token, ip, fetchImpl)`; `signPayload(key, body, ts): Promise<string>` (HMAC-SHA256 hex atas `${ts}.${body}`); Worker mengirim `POST CONTACT_MAILER_URL` dengan header `X-Timestamp`, `X-Signature`. PHP memverifikasi tanda tangan waktu-konstan, stempel waktu ≤ 5 menit, panjang dan format, menolak header injection (CR/LF), lalu mengirim email ke `corporate@promind.co.id` dengan `Reply-To` pengirim. Rate limit: 5 pesan per jam per IP (tabel `login_attempts` dengan `key` berbeda).
Situs: form di halaman kontak (nama, email, telepon opsional, topik dari `serviceAreas`, pesan, widget Turnstile), pesan sukses/gagal dua bahasa, tetap ada tautan `mailto:` sebagai satu CTA; CSP menambahkan `https://challenges.cloudflare.com` pada `script-src` dan `frame-src`; skrip form eksternal (bukan inline).

- [ ] **Step 1: Failing tests (Review Focus 7):** Turnstile gagal → 400 dan tidak ada panggilan ke mailer; honeypot terisi → 200 palsu tanpa kirim; payload invalid (email, panjang, CR/LF di nama) → 400; sukses → satu panggilan ke mailer dengan tanda tangan yang diverifikasi ulang oleh tes; rate limit → 429; CORS asing ditolak. e2e situs: form tampil di dua bahasa, validasi sisi klien, CSP tanpa pelanggaran, tidak ada `<form>` tanpa `action` aman.
- [ ] **Step 2–5:** FAIL, implementasi, PASS, commit. (PHP diperiksa dengan `php -l` bila tersedia, bila tidak: ditinjau manual dan dicatat.)

### Task 8: SPA admin (React + Vite)

**Files:** Create `admin/ui/**`, `admin/ui/vite.config.ts`, `admin/test/e2e/*.spec.ts`.

**Interfaces:** Halaman: Masuk (email, password, kode 2FA, opsi kode pemulihan); Terima undangan (set password → daftarkan 2FA: tampilkan QR dan kunci manual, konfirmasi kode, tampilkan 8 kode pemulihan sekali); Beranda (status: draft belum terbit, versi live); Konten (daftar 12 berkas); Editor per berkas (ID | EN berdampingan, tambah/hapus/urut item, isu validasi inline per bidang, simpan draft otomatis, tombol Publish dengan ringkasan perubahan/diff, progres hingga `version.json` situs memuat commit baru); Foto (unggah dan dipakai di `fieldwork`); Riwayat (commit per berkas, Pulihkan); Pengguna (khusus Administrator: daftar, undang, ubah peran, nonaktifkan, reset 2FA, cabut sesi); Log audit (Administrator); Akun saya (ganti password). Formulir digerakkan oleh deskriptor bidang per berkas (`text`, `textarea`, `bilingual`, `bilingualTextarea`, `bilingualList`, `slug`, `date`, `boolean`, `email`, `image`, `group`, `array`). UI memakai token desain situs (palet, Manrope/DM Sans), bahasa antarmuka Indonesia, aksesibel (fokus, kontras, label), responsif.

- [ ] **Step 1: Failing e2e (Playwright terhadap `wrangler dev` lokal dengan GitHub palsu):** alur undangan → pendaftaran 2FA → login; editor tidak melihat menu Pengguna; edit teks `en` hingga kosong menampilkan isu inline dan Publish nonaktif; publish memanggil GitHub palsu satu kali dan UI menunggu `version.json`; administrator menambah user lalu menonaktifkannya; axe nol pelanggaran di setiap halaman.
- [ ] **Step 2–5:** FAIL, implementasi, PASS, commit.

### Task 9: Pipeline deploy (situs dan admin)

**Files:** Create `.github/workflows/deploy-web.yml`, `deploy-admin.yml`, `web/wrangler.jsonc`, `admin/wrangler.toml` (final); Modify `web` build untuk menulis `dist/version.json`.

- [ ] **Step 1: Failing test:** `web/tests/version.test.ts`: setelah build, `dist/version.json` ada, `commit` = nilai `GITHUB_SHA` (atau `local`), `builtAt` ISO.
- [ ] **Step 2:** FAIL → tambah skrip pasca-build. PASS.
- [ ] **Step 3:** Workflow `deploy-web`: pada push `main` yang mengubah `web/**` atau jadwal harian 00:15 UTC (supaya lowongan kedaluwarsa hilang): `npm ci`, tes, build dengan `SITE_URL` sesuai lingkungan, `wrangler deploy` ke Worker static assets `promind-web`. Workflow `deploy-admin`: pada push `main` yang mengubah `admin/**`: tes, build SPA, `wrangler deploy`, migrasi D1. Secret repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (diatur lewat API GitHub dengan enkripsi sealed-box, nilai tidak pernah ditampilkan).
- [ ] **Step 4: Commit.**

### Task 10: Provisioning dan bootstrap (lingkungan nyata)

- [ ] **Step 1:** Buat D1 `promind-admin`, terapkan migrasi remote. **Step 2:** Isi secret Worker (`ENCRYPTION_KEY` acak, `GITHUB_TOKEN` dari `GITHUB_PUBLISH_TOKEN`, `CONTACT_HMAC_KEY` acak, `TURNSTILE_SECRET` dari widget yang dibuat) lewat `wrangler secret put` tanpa menampilkan. **Step 3:** Deploy Worker, pasang custom domain `admin.promind.co.id` dan situs di `staging.promind.co.id` (bila token tidak punya izin zona, berhenti dan minta pemilik menambah izin atau memasang domain di dashboard). **Step 4:** Buat undangan administrator pertama (rizky) dan tulis tautannya ke `~/.promind-invite.txt` (`chmod 600`), tidak ke chat atau log. **Step 5:** Verifikasi end-to-end di staging: login, ubah satu teks, Publish, tunggu `version.json`, lihat perubahan di `staging.promind.co.id`, riwayat dan pulihkan.

### Task 11: Dokumentasi dan review akhir

- [ ] Perbarui `docs/` (arsitektur admin, panduan admin untuk editor, keamanan, runbook rotasi token/secret, roadmap tahap 4, keputusan T3-*). Review akhir seluruh branch oleh reviewer baru, perbaiki Critical/Important dengan tes yang gagal dulu.

---

## Self-review

- **Cakupan spec bagian 4 dan 7:** editor dua bahasa dan gate (T5, T8), gambar (T6), publish dan riwayat (T5), peran dan user (T3, T4), 2FA dan rate limit (T2, T3), audit (T4), form kontak (T7), deploy (T9), provisioning (T10). Pratinjau penuh sebelum terbit diganti ringkasan diff dan verifikasi di staging (keputusan T3-1: pratinjau HTML butuh build, di luar anggaran waktu). IndexNow ditunda (T3-2: butuh kunci situs, tambahan kecil setelah domain produksi).
- **Risiko:** batas CPU Workers gratis untuk PBKDF2 (Task 0 menentukan), izin Cloudflare untuk custom domain (Task 10), dan komponen yang tak bisa diuji otomatis di lokal (PHP, Turnstile asli).
