import { codeFor, expect, PASSWORD, test } from './helpers';

test.describe('masuk', () => {
  test('a wrong code shows the uniform message; the right code signs in; sign-out works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
    await page.getByLabel('Email').fill('login@promind.co.id');
    await page.getByLabel('Kata sandi').fill(PASSWORD);
    await page.getByLabel('Kode verifikasi (6 angka)').fill('000000');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Email, kata sandi, atau kode tidak cocok');
    // Kode dikosongkan setelah gagal.
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveValue('');

    await page.getByLabel('Kode verifikasi (6 angka)').fill(await codeFor(page.request, 'login@promind.co.id'));
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('Uji Masuk');

    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page.getByText('Anda sudah keluar.')).toBeVisible();
    // Sesi benar-benar berakhir di server.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
  });

  test('too many attempts shows the wait time', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('batas@promind.co.id');
    for (let i = 0; i < 5; i++) {
      await page.getByLabel('Kata sandi').fill(`salah-${i}-kata-sandi`);
      await page.getByLabel('Kode verifikasi (6 angka)').fill('123456');
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('tidak cocok');
    }
    await page.getByLabel('Kata sandi').fill(PASSWORD);
    await page.getByLabel('Kode verifikasi (6 angka)').fill('123456');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(/Terlalu banyak percobaan\. Demi keamanan, coba lagi dalam \d+ menit/);
  });

  test('the recovery-code toggle swaps the second factor field', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Pakai kode pemulihan/ }).click();
    await expect(page.getByLabel('Kode pemulihan')).toBeFocused();
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveCount(0);
    await page.getByRole('button', { name: 'Pakai kode dari aplikasi autentikator' }).click();
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeVisible();
  });

  test('an invitation link without a token explains what to do', async ({ page }) => {
    await page.goto('/accept');
    await expect(page.getByRole('heading', { level: 1, name: 'Tautan undangan tidak lengkap' })).toBeVisible();
  });

  test('an invalid invitation token is refused in plain language and stripped from the address bar', async ({ page }) => {
    await page.goto(`/accept#token=${'x'.repeat(43)}`);
    await expect(page).toHaveURL(/\/accept$/);
    await page.getByLabel('Kata sandi baru').fill('Kalimat-Panjang-2026');
    await page.getByLabel('Ulangi kata sandi').fill('Kalimat-Panjang-2026');
    await page.getByRole('button', { name: 'Simpan dan lanjut' }).click();
    await expect(page.getByRole('alert')).toContainText('Undangan ini tidak berlaku atau sudah kedaluwarsa');
  });
});
