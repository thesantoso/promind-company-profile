import type { Page } from '@playwright/test';
import { AUTH, BASE_URL, codeFromSecret, expect, expectAccessible, expectNoOverflow, readManualKey, rowAction, screenshot, submitCredentials, test } from './helpers';

/** axe (semua dampak), tanpa gulir horizontal, dan tangkapan layar untuk pemeriksaan visual. */
async function check(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const width = page.viewportSize()!.width;
  const { scheme, wanted } = await page.evaluate(() => ({
    scheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    wanted: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  }));
  expect(scheme, 'theme follows prefers-color-scheme').toBe(wanted);
  await expectAccessible(page, `${name}@${width}-${scheme}`);
  await expectNoOverflow(page, `${name}@${width}-${scheme}`);
  await screenshot(page, `${name}-${width}-${scheme}`);
}

async function invite(page: Page, email: string, name: string): Promise<string> {
  const { csrf } = (await (await page.request.get(`${BASE_URL}/api/auth/session`)).json()) as { csrf: string };
  const r = await page.request.post(`${BASE_URL}/api/users/invite`, {
    headers: { Origin: BASE_URL, 'X-CSRF-Token': csrf },
    data: { email, name, role: 'editor' },
  });
  return ((await r.json()) as { link: string }).link;
}

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1000 },
  { width: 390, height: 844 },
];

for (const scheme of ['light', 'dark'] as const)
for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}px ${scheme}`, () => {
    test.use({ viewport, colorScheme: scheme });

    test.describe('signed out', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('login steps and the accept-invite error screen', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
        await check(page, 'login-step1');
        await submitCredentials(page, `a11y-login-${viewport.width}-${scheme}@promind.co.id`, 'salah');
        await expect(page.getByRole('alert')).toBeVisible();
        await check(page, 'login-step1-error');
        // Pengguna yang sudah terdaftar autentikator: langkah kode.
        // Dua akun bergantian agar kode salah tidak melewati batas percobaan (5 per akun).
        await submitCredentials(page, viewport.width === 390 ? 'login@promind.co.id' : 'admin@promind.co.id');
        await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeVisible();
        await check(page, 'login-step2-code');
        await page.getByLabel('Kode verifikasi (6 angka)').fill('000000');
        await page.getByRole('button', { name: 'Masuk', exact: true }).click();
        await expect(page.getByRole('alert')).toBeVisible();
        await check(page, 'login-step2-code-error');
        await page.getByRole('button', { name: 'Pakai kode pemulihan' }).click();
        await check(page, 'login-step2-recovery');
        await page.goto('/accept');
        await expect(page.getByRole('heading', { level: 1, name: 'Tautan undangan tidak lengkap' })).toBeVisible();
        await check(page, 'accept-missing-token');
      });
    });

    test.describe('administrator', () => {
      test.use({ storageState: AUTH.admin });

      test('invitation steps (password, QR, recovery codes) and login-enroll', async ({ page, browser }) => {
        const email = `a11y-${viewport.width}-${scheme}@promind.co.id`;
        const link = await invite(page, email, `Uji Aksesibilitas ${viewport.width} ${scheme}`);
        const ctx = await browser.newContext({ viewport, colorScheme: scheme, storageState: { cookies: [], origins: [] } });
        const p = await ctx.newPage();
        await p.goto(link);
        await p.getByLabel('Kata sandi baru').fill('Kalimat');
        await check(p, 'accept-password');
        await p.getByLabel('Kata sandi baru').fill('Kalimat-Rahasia-Uji-2026');
        await p.getByLabel('Ulangi kata sandi').fill('Kalimat-Rahasia-Uji-2026');
        await p.getByRole('button', { name: 'Simpan dan lanjut' }).click();
        await expect(p.getByRole('img', { name: 'Kode QR untuk aplikasi autentikator' })).toBeVisible();
        await check(p, 'accept-qr');
        await p.getByText('Tidak bisa scan?').click();
        await check(p, 'accept-qr-manual');
        await ctx.close();

        // Akun yang belum menyiapkan autentikator dipandu dari layar masuk.
        const ctx2 = await browser.newContext({ viewport, colorScheme: scheme, storageState: { cookies: [], origins: [] } });
        const q = await ctx2.newPage();
        await q.goto('/');
        await submitCredentials(q, email, 'Kalimat-Rahasia-Uji-2026');
        await expect(q.getByRole('img', { name: 'Kode QR untuk aplikasi autentikator' })).toBeVisible();
        await check(q, 'login-step2-enroll');
        const secret = await readManualKey(q);
        await q.getByLabel('Masukkan kode 6 angka dari aplikasi').fill('000000');
        await q.getByRole('button', { name: 'Verifikasi dan lanjut' }).click();
        await expect(q.getByRole('alert')).toBeVisible();
        await check(q, 'login-step2-enroll-error');
        await q.getByLabel('Masukkan kode 6 angka dari aplikasi').fill(await codeFromSecret(q.request, secret));
        await q.getByRole('button', { name: 'Verifikasi dan lanjut' }).click();
        await expect(q.getByTestId('recovery-codes').locator('li')).toHaveCount(8);
        await check(q, 'recovery-codes');
        await ctx2.close();
      });

      test('users, dialogs, and audit log', async ({ page }) => {
        await page.goto('/pengguna');
        await expect(page.locator('tbody tr').first()).toBeVisible();
        await check(page, 'users');
        await page.getByRole('button', { name: 'Undang pengguna' }).click();
        await check(page, 'users-invite-dialog');
        const dialog = page.getByRole('dialog', { name: 'Undang pengguna' });
        await dialog.getByLabel('Nama').fill('Calon Editor');
        await dialog.getByLabel('Email').fill(`calon-${viewport.width}-${scheme}@promind.co.id`);
        await dialog.getByRole('button', { name: 'Buat undangan' }).click();
        await expect(page.getByRole('dialog', { name: 'Tautan undangan' })).toBeVisible();
        await check(page, 'users-invite-link');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        // Fokus kembali ke tombol yang membuka dialog.
        await expect(page.getByRole('button', { name: 'Undang pengguna' })).toBeFocused();
        await rowAction(page.locator('tbody tr', { hasText: 'admin@promind.co.id' }), 'Admin Utama', 'Ubah nama atau peran');
        await check(page, 'users-edit-dialog');
        await page.keyboard.press('Escape');
        await page.goto('/log-audit');
        await expect(page.locator('tbody tr').first()).toBeVisible();
        await page.locator('tbody tr').first().getByText('Data lengkap').click();
        await check(page, 'audit');
      });
    });

    test.describe('editor', () => {
      test.use({ storageState: AUTH.editor });

      test('overview, content list, photos, account, 403, and the mobile menu', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
        await check(page, 'overview');
        if (viewport.width < 960) {
          const menu = page.getByRole('button', { name: 'Menu', exact: true });
          await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden();
          await menu.click();
          await expect(menu).toHaveAttribute('aria-expanded', 'true');
          await check(page, 'overview-menu-open');
          await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Konten', exact: true }).click();
          await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden();
        } else {
          await page.goto('/konten');
        }
        await expect(page.getByRole('heading', { level: 1, name: 'Konten' })).toBeVisible();
        await check(page, 'content-list');
        await page.goto('/foto');
        await expect(page.locator('.photo-grid')).toBeVisible();
        await check(page, 'photos');
        await page.goto('/akun');
        await check(page, 'account');
        await page.goto('/pengguna');
        await check(page, 'forbidden');
        await page.goto('/tidak-ada');
        await check(page, 'not-found');
      });

      test('editors: long list file, nested file, issues, publish dialog, history', async ({ page }) => {
        await page.goto('/konten/careers');
        const first = page.locator('ol.items > li').first();
        await first.locator('summary').click();
        await expect(first.getByLabel('Judul, Indonesia', { exact: true })).toBeVisible();
        await check(page, 'editor-careers');

        await page.goto('/konten/pages');
        await expect(page.getByRole('heading', { level: 2, name: 'Beranda' })).toBeVisible();
        await check(page, 'editor-pages');

        // Draf dengan masalah, lalu draf yang valid untuk dialog terbit.
        await page.goto('/konten/pillars');
        const item = page.locator('ol.items > li').nth(1);
        await item.locator('summary').click();
        const en = item.getByLabel('Ringkasan, English (US)');
        const original = await en.inputValue();
        await en.fill('');
        await expect(page.locator('.issue-summary')).toBeVisible();
        await check(page, 'editor-issues');
        await en.fill(`${original} Updated.`);
        await expect(page.getByTestId('save-state')).toHaveText(/Draf tersimpan/);
        await expect(page.getByRole('button', { name: 'Terbitkan', exact: true })).toBeEnabled();
        await page.getByRole('button', { name: 'Terbitkan', exact: true }).click();
        await expect(page.getByRole('dialog').locator('.diff')).toBeVisible();
        await check(page, 'publish-dialog');
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Buang draf' }).click();
        await check(page, 'discard-dialog');
        await page.getByRole('alertdialog', { name: 'Buang draf?' }).getByRole('button', { name: 'Ya, buang draf' }).click();
        await expect(page.locator('.page-head')).toContainText('Sama dengan situs');

        await page.goto('/konten/careers/riwayat');
        await expect(page.locator('tbody tr').first()).toBeVisible();
        await check(page, 'history');
      });
    });
  });
}
