import { AUTH, expect, makeJpeg, test } from './helpers';
import type { Page } from '@playwright/test';

test.use({ storageState: AUTH.editor });

const pick = (page: Page) => page.locator('.panel input[type="file"]');

async function upload(page: Page, name: string, buffer: Buffer, mimeType = 'image/jpeg') {
  await pick(page).setInputFiles({ name, mimeType, buffer });
}

test('upload a photo, then each server error code gets a clear message', async ({ page }) => {
  await page.goto('/foto');
  await expect(page.getByRole('heading', { level: 1, name: 'Foto' })).toBeVisible();
  const panel = page.locator('.panel');

  await upload(page, 'Lobi Gedung.jpg', await makeJpeg(page, 1200, 900));
  await expect(panel.getByRole('status').filter({ hasText: 'terunggah' })).toContainText('Foto lobi-gedung.jpg terunggah (1200×900 px');
  const tile = page.locator('.photo-grid li', { hasText: 'lobi-gedung.jpg' });
  await expect(tile).toContainText('Unggahan baru');
  await expect(tile.locator('img')).toHaveJSProperty('complete', true);
  expect(await tile.locator('img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(1200);

  await upload(page, 'kecil.jpg', await makeJpeg(page, 600, 400));
  await expect(panel.getByRole('alert')).toContainText('Foto terlalu kecil: lebar minimal 800 piksel');

  await upload(page, 'bukan-foto.jpg', Buffer.from('ini bukan gambar sama sekali'), 'image/jpeg');
  await expect(panel.getByRole('alert')).toContainText('bukan foto JPEG yang valid');

  await upload(page, 'foto.versi2.jpg', await makeJpeg(page, 1000, 800));
  await expect(panel.getByRole('alert')).toContainText('Nama berkas tidak valid');

  await upload(page, 'besar.jpg', Buffer.alloc(1_700_000, 7));
  await expect(panel.getByRole('alert')).toContainText('lebih besar dari 1,5 MB');

  // Nama yang sudah ada di repo: tawarkan untuk menimpa.
  await upload(page, 'building-operations.jpg', await makeJpeg(page, 1000, 750));
  const dialog = page.getByRole('alertdialog', { name: 'Timpa foto lama?' });
  await expect(dialog).toContainText('building-operations.jpg');
  await dialog.getByRole('button', { name: 'Ya, timpa foto lama' }).click();
  await expect(panel.getByRole('status').filter({ hasText: 'terunggah' })).toContainText('Foto building-operations.jpg terunggah');
  await expect(page.locator('.photo-grid li', { hasText: 'building-operations.jpg' })).toContainText('Unggahan baru');
});

test('a large phone photo is compressed in the browser before upload', async ({ page }) => {
  await page.goto('/foto');
  const big = await makeJpeg(page, 3000, 2000, { noise: true, quality: 1 });
  expect(big.length).toBeGreaterThan(1_500_000);
  await upload(page, 'IMG_2041.JPG', big);
  const ok = page.locator('.panel').getByRole('status').filter({ hasText: 'terunggah' });
  await expect(ok).toContainText('Foto img-2041.jpg terunggah (2000×1333 px', { timeout: 30_000 });
});

test('the content editor can pick an uploaded photo for a fieldwork item', async ({ page }) => {
  await page.goto('/konten/fieldwork');
  const first = page.locator('ol.items > li').first();
  await first.locator('summary').click();
  const select = first.getByLabel('Pilih foto');
  await expect(select).toHaveValue('building-operations.jpg');
  await select.selectOption('lobi-gedung.jpg');
  await expect(first.locator('img.thumb')).toBeVisible();
  await expect(page.getByTestId('save-state')).toHaveText(/Draf tersimpan/);
  await expect(page.locator('.issue-summary')).toHaveCount(0);
  await page.getByRole('button', { name: 'Buang draf' }).click();
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).getByRole('button', { name: 'Ya, buang draf' }).click();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
});
