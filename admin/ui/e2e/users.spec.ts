import { AUTH, BASE_URL, codeFromSecret, expect, PASSWORD, rowAction, test } from './helpers';
import type { Browser, Page } from '@playwright/test';

test.use({ storageState: AUTH.admin });

async function readSecret(page: Page) {
  return ((await page.getByTestId('totp-secret').textContent()) ?? '').replace(/\s+/g, '');
}

/** Membuka tautan undangan di browser bersih dan menyelesaikan seluruh pendaftaran. Mengembalikan kode pemulihan. */
async function acceptInvite(browser: Browser, link: string, email: string) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto(link);
  await expect(page).toHaveURL(/\/accept$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Selamat datang');
  const pw = page.getByLabel('Kata sandi baru');
  await pw.fill('pendek');
  await expect(page.locator('#pw-hints li').first()).toHaveClass(/\btodo\b/);
  await page.getByLabel('Ulangi kata sandi').fill('pendek');
  await page.getByRole('button', { name: 'Simpan dan lanjut' }).click();
  await expect(page.getByRole('alert')).toContainText('belum memenuhi syarat');
  await pw.fill('Kalimat-Rahasia-Nadia-2026');
  await expect(page.locator('#pw-hints li.ok')).toHaveCount(3);
  await page.getByLabel('Ulangi kata sandi').fill('Kalimat-Rahasia-Nadia-2026');
  await page.getByRole('button', { name: 'Simpan dan lanjut' }).click();

  await expect(page.getByRole('img', { name: 'Kode QR untuk aplikasi autentikator' })).toBeVisible();
  const secret = await readSecret(page);
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  await page.getByText('Tampilkan tautan otpauth').click();
  await expect(page.locator('.otpauth')).toContainText('otpauth://totp/PROMIND%20Admin:');
  await page.getByLabel('Kode 6 angka dari aplikasi').fill('000000');
  await page.getByRole('button', { name: 'Konfirmasi kode' }).click();
  await expect(page.getByRole('alert')).toContainText('Kode verifikasi salah');
  await page.getByLabel('Kode 6 angka dari aplikasi').fill(await codeFromSecret(page.request, secret));
  await page.getByRole('button', { name: 'Konfirmasi kode' }).click();

  const codes = page.getByTestId('recovery-codes').locator('li');
  await expect(codes).toHaveCount(8);
  const recovery = await codes.allTextContents();
  const next = page.getByRole('button', { name: 'Lanjut ke halaman masuk' });
  await expect(next).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Unduh .txt' }).click();
  expect((await download).suggestedFilename()).toBe('kode-pemulihan-promind.txt');
  await page.getByLabel('Saya sudah menyimpan kode pemulihan').check();
  await next.click();

  // Masuk pertama memakai kode pemulihan (kode TOTP langkah yang sama tidak boleh dipakai ulang).
  await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue(email);
  await page.getByLabel('Kata sandi').fill('Kalimat-Rahasia-Nadia-2026');
  await page.getByRole('button', { name: /Pakai kode pemulihan/ }).click();
  await page.getByLabel('Kode pemulihan').fill(recovery[0]!);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Nadia Putri');
  return { ctx, page };
}

test('invite → accept → 2FA → recovery codes → sign in; reset 2FA; deactivate; last administrator is protected', async ({ page, browser }) => {
  await page.goto('/pengguna');
  await expect(page.getByRole('heading', { level: 1, name: 'Pengguna' })).toBeVisible();
  await page.getByRole('button', { name: 'Undang pengguna' }).click();
  let dialog = page.getByRole('dialog', { name: 'Undang pengguna' });
  await expect(dialog.getByLabel('Nama')).toBeFocused();
  await dialog.getByLabel('Nama').fill('Nadia Putri');
  await dialog.getByLabel('Email').fill('nadia@promind.co.id');
  await dialog.getByLabel('Peran').selectOption('editor');
  await dialog.getByRole('button', { name: 'Buat undangan' }).click();
  dialog = page.getByRole('dialog', { name: 'Tautan undangan' });
  const link = await dialog.getByLabel('Tautan undangan').inputValue();
  expect(link).toMatch(/^http:\/\/127\.0\.0\.1:8788\/accept#token=[A-Za-z0-9_-]{43}$/);
  await expect(dialog).toContainText('hanya ditampilkan sekali');
  await dialog.getByRole('button', { name: 'Salin tautan' }).click();
  await expect(dialog.getByRole('button', { name: 'Tersalin' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  await dialog.getByRole('button', { name: 'Selesai' }).click();
  await expect(page.getByText(link)).toHaveCount(0);

  // Mengundang email yang sama lagi saat masih menunggu: undangan lama diganti; email pengguna yang sudah ada ditolak.
  await page.getByRole('button', { name: 'Undang pengguna' }).click();
  dialog = page.getByRole('dialog', { name: 'Undang pengguna' });
  await dialog.getByLabel('Nama').fill('Admin Kedua');
  await dialog.getByLabel('Email').fill('admin@promind.co.id');
  await dialog.getByRole('button', { name: 'Buat undangan' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Sudah ada pengguna dengan email ini');
  await dialog.getByRole('button', { name: 'Batal' }).click();

  const { ctx, page: nadia } = await acceptInvite(browser, link, 'nadia@promind.co.id');

  await page.reload();
  const row = page.locator('tbody tr', { hasText: 'nadia@promind.co.id' });
  await expect(row).toContainText('Aktif');
  await expect(row).toContainText('Editor');

  // Reset 2FA → sesi Nadia berakhir → ia mengaktifkan ulang lewat /aktifkan-2fa.
  await rowAction(row, 'Nadia Putri', 'Reset 2FA');
  dialog = page.getByRole('alertdialog', { name: 'Reset verifikasi 2 langkah Nadia Putri?' });
  await expect(dialog).toContainText('/aktifkan-2fa');
  await dialog.getByRole('button', { name: 'Ya, reset 2FA' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'direset' })).toBeVisible();
  await expect(row).toContainText('Menunggu aktivasi 2 langkah');
  await nadia.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Konten', exact: true }).click();
  await expect(nadia.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
  await expect(nadia.getByText('Sesi Anda sudah berakhir')).toBeVisible();
  await nadia.getByRole('link', { name: 'Aktifkan ulang di sini' }).click();
  await nadia.getByLabel('Email').fill('nadia@promind.co.id');
  await nadia.getByLabel('Kata sandi').fill('Kalimat-Rahasia-Nadia-2026');
  await nadia.getByRole('button', { name: 'Lanjut' }).click();
  await expect(nadia.getByRole('img', { name: 'Kode QR untuk aplikasi autentikator' })).toBeVisible();
  await nadia.getByLabel('Kode 6 angka dari aplikasi').fill(await codeFromSecret(nadia.request, await readSecret(nadia)));
  await nadia.getByRole('button', { name: 'Konfirmasi kode' }).click();
  await expect(nadia.getByTestId('recovery-codes').locator('li')).toHaveCount(8);
  await ctx.close();

  // Nonaktifkan.
  await page.reload();
  await rowAction(row, 'Nadia Putri', 'Nonaktifkan');
  dialog = page.getByRole('alertdialog', { name: 'Nonaktifkan Nadia Putri?' });
  await expect(dialog).toContainText('tidak bisa masuk lagi');
  await dialog.getByRole('button', { name: 'Ya, nonaktifkan' }).click();
  await expect(row).toContainText('Nonaktif');
  await row.getByRole('button', { name: 'Tindakan untuk Nadia Putri' }).click();
  await expect(page.getByRole('menuitem', { name: 'Aktifkan', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  // Administrator terakhir tidak bisa diturunkan atau dinonaktifkan.
  const me = page.locator('tbody tr', { hasText: 'admin@promind.co.id' });
  await rowAction(me, 'Admin Utama', 'Ubah nama atau peran');
  dialog = page.getByRole('dialog', { name: 'Ubah Admin Utama' });
  await dialog.getByLabel('Peran').selectOption('editor');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Harus selalu ada minimal satu administrator aktif');
  await dialog.getByRole('button', { name: 'Batal' }).click();
  await rowAction(me, 'Admin Utama', 'Nonaktifkan');
  dialog = page.getByRole('alertdialog', { name: 'Nonaktifkan Admin Utama?' });
  await expect(dialog).toContainText('Ini akun Anda sendiri');
  await dialog.getByRole('button', { name: 'Ya, nonaktifkan' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Harus selalu ada minimal satu administrator aktif');
  await dialog.getByRole('button', { name: 'Batal' }).click();
  await expect(me).toContainText('Administrator');
  await expect(me).toContainText('Aktif');
});

test('the audit log lists entries with readable labels and expandable details', async ({ page }) => {
  // Satu percobaan masuk yang gagal agar tercatat di log.
  await page.request.post(`${BASE_URL}/api/auth/login`, {
    headers: { Origin: BASE_URL },
    data: { email: 'login@promind.co.id', password: 'bukan-kata-sandinya', code: '000000' },
  });
  await page.goto('/log-audit');
  await expect(page.getByRole('heading', { level: 1, name: 'Log audit' })).toBeVisible();
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  await expect(page.locator('tbody')).toContainText('Masuk berhasil');
  await expect(page.locator('tbody')).toContainText('Gagal masuk');
  await expect(page.locator('tbody')).toContainText('Membuat undangan');
  const withDetail = rows.filter({ hasText: 'Membuat undangan' }).first();
  await withDetail.getByText('Data lengkap').click();
  await expect(withDetail.locator('pre')).toContainText('"role"');
});

test('changing my password works and enforces the rules', async ({ page, browser }) => {
  // Akun terpisah agar sesi bersama tidak terputus.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const p = await ctx.newPage();
  const { login } = await import('./helpers');
  await login(p, 'akun@promind.co.id');
  await p.getByRole('link', { name: 'Akun saya' }).click();
  await expect(p.getByRole('heading', { level: 1, name: 'Akun saya' })).toBeVisible();
  await p.getByLabel('Kata sandi saat ini').fill('salah-sekali-ini');
  await p.getByLabel('Kata sandi baru', { exact: true }).fill('Kata-Sandi-Baru-2026');
  await p.getByLabel('Ulangi kata sandi baru').fill('Kata-Sandi-Baru-2026');
  await p.getByRole('button', { name: 'Ganti kata sandi' }).click();
  await expect(p.getByRole('alert')).toContainText('Kata sandi saat ini salah');
  await p.getByLabel('Kata sandi saat ini').fill(PASSWORD);
  await p.getByRole('button', { name: 'Ganti kata sandi' }).click();
  await expect(p.getByText('Kata sandi sudah diganti.')).toBeVisible();
  await ctx.close();
  void page;
});
