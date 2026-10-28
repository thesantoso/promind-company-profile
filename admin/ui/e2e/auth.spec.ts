import { codeFor, codeFromSecret, expect, PASSWORD, readManualKey, submitCredentials, test } from './helpers';

test.describe('masuk dua langkah', () => {
  test('enrolled user: email and password first, then the code; wrong code is refused; sign-out works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
    // Langkah 1 tidak menanyakan kode.
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveCount(0);
    await expect(page.getByText('Verifikasi 2 langkah direset administrator? Cukup masuk dengan email dan password')).toBeVisible();
    await expect(page.getByRole('link', { name: /Aktifkan ulang/ })).toHaveCount(0);

    await submitCredentials(page, 'login@promind.co.id');
    await expect(page.getByRole('heading', { level: 2, name: 'Kode verifikasi' })).toBeVisible();
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeFocused();
    await expect(page.getByText('login@promind.co.id', { exact: true })).toBeVisible();

    await page.getByLabel('Kode verifikasi (6 angka)').fill('000000');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Email, kata sandi, atau kode tidak cocok');
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveValue('');
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeFocused();

    await page.getByLabel('Kode verifikasi (6 angka)').fill(await codeFor(page.request, 'login@promind.co.id'));
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('Uji Masuk');

    await page.getByRole('banner').getByRole('button', { name: /menu pengguna/ }).click();
    await page.getByRole('menuitem', { name: 'Keluar' }).click();
    await expect(page.getByText('Anda sudah keluar.')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
  });

  test('wrong password at step 1 gives one friendly message; Kembali returns to step 1 with focus on email', async ({ page }) => {
    await page.goto('/');
    await submitCredentials(page, 'editor@promind.co.id', 'salah-kata-sandi-ini');
    await expect(page.getByRole('alert')).toContainText('Email atau kata sandi tidak cocok');
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveCount(0);
    // Email yang tidak dikenal mendapat pesan yang sama.
    await submitCredentials(page, 'tidak-ada@promind.co.id', 'salah-kata-sandi-ini');
    await expect(page.getByRole('alert')).toContainText('Email atau kata sandi tidak cocok');

    await submitCredentials(page, 'editor@promind.co.id');
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeVisible();
    await page.getByRole('button', { name: 'Kembali' }).click();
    await expect(page.getByLabel('Email')).toBeFocused();
    await expect(page.getByLabel('Email')).toHaveValue('editor@promind.co.id');
  });

  test('too many attempts shows the wait time', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await submitCredentials(page, 'batas@promind.co.id', `salah-${i}-kata-sandi`);
      await expect(page.getByRole('alert')).toContainText('tidak cocok');
    }
    await submitCredentials(page, 'batas@promind.co.id');
    await expect(page.getByRole('alert')).toContainText(/Terlalu banyak percobaan\. Demi keamanan, coba lagi dalam \d+ menit/);
  });

  test('the recovery-code toggle swaps the second factor field', async ({ page }) => {
    await page.goto('/');
    await submitCredentials(page, 'editor@promind.co.id');
    await page.getByRole('button', { name: 'Pakai kode pemulihan' }).click();
    await expect(page.getByLabel('Kode pemulihan')).toBeFocused();
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveCount(0);
    await page.getByRole('button', { name: 'Pakai kode dari aplikasi autentikator' }).click();
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toBeVisible();
  });

  test('keyboard only: tab through step 1, submit with Enter, focus lands in the code field', async ({ page }) => {
    await page.goto('/');
    const email = page.getByLabel('Email');
    await email.focus();
    await page.keyboard.type('login@promind.co.id');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Kata sandi')).toBeFocused();
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Lanjut', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    const code = page.getByLabel('Kode verifikasi (6 angka)');
    await expect(code).toBeFocused();
    await page.keyboard.type(await codeFor(page.request, 'login@promind.co.id'));
    // Tab order in step 2: code -> Masuk -> recovery toggle -> Kembali.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Pakai kode pemulihan' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Kembali' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
  });

  test('user without an authenticator is guided into setup, ends signed in, and recovery-code login works later', async ({ page, browser }) => {
    await page.goto('/');
    await submitCredentials(page, 'staf@promind.co.id');
    // Tidak ada permintaan kode: langsung penyiapan.
    await expect(page.getByLabel('Kode verifikasi (6 angka)')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Siapkan verifikasi 2 langkah' })).toBeFocused();
    await expect(page.getByRole('img', { name: 'Kode QR untuk aplikasi autentikator' })).toBeVisible();
    await expect(page.getByText(/Google Authenticator, Microsoft Authenticator, atau 1Password/)).toBeVisible();
    const secret = await readManualKey(page);
    await expect(page.locator('.otpauth')).toContainText('otpauth://totp/PROMIND%20Admin:');

    await page.getByLabel('Masukkan kode 6 angka dari aplikasi').fill('000000');
    await page.getByRole('button', { name: 'Verifikasi dan lanjut' }).click();
    await expect(page.getByRole('alert')).toContainText('Kode verifikasi salah');

    // Layar kode pemulihan: tombol lanjut terkunci sampai kotak dicentang.
    await page.getByLabel('Masukkan kode 6 angka dari aplikasi').fill(await codeFromSecret(page.request, secret));
    await page.getByRole('button', { name: 'Verifikasi dan lanjut' }).click();
    await expect(page.getByTestId('recovery-codes').locator('li')).toHaveCount(8);
    await expect(page.getByRole('heading', { level: 2, name: 'Simpan kode pemulihan' })).toBeFocused();
    const recovery = await page.getByTestId('recovery-codes').locator('li').allTextContents();
    const enter = page.getByRole('button', { name: 'Masuk ke portal' });
    await expect(enter).toBeDisabled();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh .txt' }).click();
    expect((await download).suggestedFilename()).toBe('kode-pemulihan-promind.txt');
    await page.getByRole('button', { name: 'Salin', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(recovery.join('\n'));
    await page.getByLabel('Saya sudah menyimpan kode pemulihan').check();
    await enter.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('Staf Baru');

    // Masuk lagi di browser bersih: kini diminta kode (bukan penyiapan); kode pemulihan berfungsi.
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const p2 = await ctx.newPage();
    await p2.goto('/');
    await submitCredentials(p2, 'staf@promind.co.id');
    await expect(p2.getByLabel('Kode verifikasi (6 angka)')).toBeVisible();
    await p2.getByRole('button', { name: 'Pakai kode pemulihan' }).click();
    await p2.getByLabel('Kode pemulihan').fill(recovery[0]!);
    await p2.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(p2.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
    await ctx.close();
  });

  test('the old /aktifkan-2fa address redirects to the login page', async ({ page }) => {
    await page.goto('/aktifkan-2fa');
    await expect(page).toHaveURL(/\/masuk$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
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
