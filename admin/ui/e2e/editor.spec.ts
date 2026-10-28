import { AUTH, BASE_URL, expect, test } from './helpers';
import type { Page } from '@playwright/test';

test.use({ storageState: AUTH.editor });

const saveState = (page: Page) => page.getByTestId('save-state');
const publishButton = (page: Page) => page.getByRole('button', { name: 'Terbitkan', exact: true });
const items = (page: Page) => page.locator('ol.items > li');

async function waitSaved(page: Page) {
  await expect(saveState(page)).toHaveText(/Draf tersimpan \d\d:\d\d/);
}

test('editors do not see or open the administrator pages', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  await expect(nav.getByRole('link', { name: 'Konten' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Pengguna' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Log audit' })).toHaveCount(0);
  await page.goto('/pengguna');
  await expect(page.getByRole('heading', { level: 1, name: 'Khusus administrator' })).toBeVisible();
  await page.goto('/log-audit');
  await expect(page.getByRole('heading', { level: 1, name: 'Khusus administrator' })).toBeVisible();
  // Server juga menolak.
  expect((await page.request.get(`${BASE_URL}/api/users`)).status()).toBe(403);
});

test('blanking an English value shows the inline issue, the summary, and blocks publishing; discard restores', async ({ page }) => {
  await page.goto('/konten/pillars');
  await expect(page.getByRole('heading', { level: 1, name: 'Nilai perusahaan' })).toBeVisible();
  await expect(publishButton(page)).toBeDisabled();
  const first = items(page).first();
  await first.locator('summary').click();
  const en = first.getByLabel('Judul, English (US)');
  const original = await en.inputValue();
  await en.fill('');
  await expect(saveState(page)).toHaveText(/Ada perubahan|Menyimpan…/);
  await waitSaved(page);

  await expect(en).toHaveAttribute('aria-invalid', 'true');
  await expect(first.locator('.field-error').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ada 1 isian yang perlu diperbaiki/ })).toBeVisible();
  await expect(publishButton(page)).toBeDisabled();
  await expect(page.locator('#publish-reason')).toContainText('Perbaiki 1 isian');
  await expect(first.locator('summary')).toContainText('Perlu diperbaiki');

  // Tautan di ringkasan membuka butir yang tertutup dan memfokuskan isian.
  await first.locator('summary').click();
  await expect(en).toBeHidden();
  await page.locator('.issue-summary a').first().click();
  await expect(en).toBeFocused();

  await en.fill(original);
  await waitSaved(page);
  await expect(page.locator('.issue-summary')).toHaveCount(0);
  await expect(en).not.toHaveAttribute('aria-invalid', 'true');
  // Draf sama persis dengan versi tayang: tidak ada yang bisa diterbitkan.
  await expect(page.locator('#publish-reason')).toContainText('Belum ada perubahan');

  await page.getByRole('button', { name: 'Buang draf' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Buang draf?' });
  await dialog.getByRole('button', { name: 'Ya, buang draf' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main').getByText('Draf dibuang.')).toBeVisible();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
});

test('careers: add a job, add a list row, reorder, then publish with a diff review until the site is live', async ({ page }) => {
  await page.goto('/konten/careers');
  await expect(items(page)).toHaveCount(5);

  // Baris baru di daftar tanggung jawab lowongan pertama.
  const job1 = items(page).first();
  await job1.locator('summary').click();
  await job1.getByRole('button', { name: 'Tambah baris tanggung jawab' }).click();
  const newRowId = job1.getByLabel('Tanggung jawab baris 7, Indonesia');
  await expect(newRowId).toBeFocused();
  await newRowId.fill('Menyusun laporan bulanan untuk pemilik gedung');
  await job1.getByLabel('Tanggung jawab baris 7, English (US)').fill('Prepare monthly reports for the building owner');
  await expect(saveState(page)).toHaveText(/Ada perubahan|Menyimpan…|Draf tersimpan/);

  // Lowongan baru.
  await page.getByRole('button', { name: 'Tambah lowongan' }).click();
  await expect(items(page)).toHaveCount(6);
  const job = items(page).nth(5);
  await expect(job.getByLabel('Slug (alamat halaman)')).toBeFocused();
  await job.getByLabel('Slug (alamat halaman)').fill('staf-administrasi-gedung');
  await job.getByLabel('Email untuk lamaran').fill('karir@promind.co.id');
  await expect(job.getByLabel('Tanggal tayang')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await expect(job.getByLabel('Berlaku sampai (opsional)')).toHaveValue('');
  await job.getByLabel('Berlaku sampai (opsional)').fill('2026-12-31');
  const boxes = job.locator('input[type="text"], textarea');
  const n = await boxes.count();
  for (let i = 0; i < n; i++) {
    const box = boxes.nth(i);
    if ((await box.inputValue()) === '') await box.fill('Staf Administrasi Gedung');
  }
  await job.getByLabel('Tampilkan di situs').check();
  await waitSaved(page);
  await expect(page.locator('.issue-summary')).toHaveCount(0);

  // Urutkan: lowongan baru naik satu posisi.
  await job.getByRole('button', { name: 'Naikkan lowongan 6' }).click();
  await expect(items(page).nth(4).locator('summary')).toContainText('Staf Administrasi Gedung');
  await expect(items(page).nth(5).locator('summary')).toContainText('HSE & Fire Safety Officer');
  await expect(saveState(page)).toHaveText(/Ada perubahan|Menyimpan…/);
  await waitSaved(page);
  await expect(publishButton(page)).toBeEnabled();

  await publishButton(page).click();
  const dialog = page.getByRole('dialog', { name: 'Terbitkan: Lowongan' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.diff')).toContainText('Lowongan 1 (Building Manager) › Tanggung jawab › Indonesia › baris 7');
  await expect(dialog.locator('.diff')).toContainText('Menyusun laporan bulanan untuk pemilik gedung');
  await expect(dialog.locator('.diff')).toContainText('Ditambah');
  await dialog.getByLabel('Catatan (opsional)').fill('Uji e2e: lowongan baru');
  await dialog.getByRole('button', { name: 'Ya, terbitkan sekarang' }).click();
  await expect(dialog.getByRole('list', { name: 'Kemajuan penerbitan' })).toContainText('Mengirim ke Git');
  await expect(dialog.getByText('Situs sedang dibangun ulang')).toBeVisible();
  await expect(dialog.getByText(/Selesai\. Perubahan sudah tayang/)).toBeVisible({ timeout: 30_000 });
  await dialog.getByRole('button', { name: 'Selesai' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
  await expect(items(page)).toHaveCount(6);

  const head = (await (await page.request.get(`${BASE_URL}/__test/head`)).json()) as { message: string };
  expect(head.message).toContain('content: update careers (by Editor Satu)');
  expect(head.message).toContain('Uji e2e: lowongan baru');
});

test('a conflicting change in Git is explained and the draft can be discarded', async ({ page }) => {
  await page.goto('/konten/engagement');
  const first = items(page).first();
  await first.locator('summary').click();
  await first.getByLabel('Ringkasan, English (US)').fill('Full management of the building, end to end.');
  await waitSaved(page);
  // Seseorang mengubah berkas yang sama langsung di Git.
  await page.request.post(`${BASE_URL}/__test/commit`, { data: { key: 'engagement', transform: 'reverse' } });

  await publishButton(page).click();
  const dialog = page.getByRole('dialog', { name: 'Terbitkan: Model kerja sama' });
  await dialog.getByRole('button', { name: 'Ya, terbitkan sekarang' }).click();
  await expect(dialog.getByRole('alert')).toContainText('sudah diubah di tempat lain');
  await dialog.getByRole('button', { name: 'Buang draf Model kerja sama dan muat ulang' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
  // Data terbaru (urutan terbalik) dimuat.
  await expect(items(page).first().locator('summary')).toContainText('Pendampingan SOP');
});

test('history lists versions; restore is refused while a draft exists and works without one', async ({ page }) => {
  // Versi kedua untuk berkas standar.
  await page.request.post(`${BASE_URL}/__test/commit`, { data: { key: 'standards', transform: 'reverse' } });
  await page.goto('/konten/standards/riwayat');
  await expect(page.getByRole('heading', { name: 'Riwayat perubahan' })).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Versi yang tayang sekarang');
  await expect(rows.first()).toContainText('someone-else');

  // Buat draf, lalu coba pulihkan.
  await page.getByRole('link', { name: 'Isi' }).click();
  const first = items(page).first();
  await first.locator('summary').click();
  await first.getByLabel('Kode').fill('BMS 2');
  await waitSaved(page);
  await page.getByRole('link', { name: 'Riwayat' }).click();
  await expect(page.getByText('masih punya draf yang belum diterbitkan')).toBeVisible();
  await rows.nth(1).getByRole('button', { name: /Pulihkan versi ini/ }).click();
  let dialog = page.getByRole('alertdialog', { name: 'Pulihkan versi ini?' });
  await dialog.getByRole('button', { name: 'Ya, pulihkan dan terbitkan' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Masih ada draf untuk berkas ini');
  await dialog.getByRole('button', { name: 'Batal' }).click();

  // Buang draf, lalu pulihkan.
  await page.getByRole('link', { name: 'Isi' }).click();
  await page.getByRole('button', { name: 'Buang draf' }).click();
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).getByRole('button', { name: 'Ya, buang draf' }).click();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
  await page.getByRole('link', { name: 'Riwayat' }).click();
  await rows.nth(1).getByRole('button', { name: /Pulihkan versi ini/ }).click();
  dialog = page.getByRole('alertdialog', { name: 'Pulihkan versi ini?' });
  await dialog.getByRole('button', { name: 'Ya, pulihkan dan terbitkan' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main').getByText(/dipulihkan dan diterbitkan/)).toBeVisible();
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('content: restore standards');
  await page.getByRole('link', { name: 'Isi' }).click();
  await expect(items(page).first().locator('summary')).toContainText('Quality Management System');
});

test('nested pages file: grouped sections, route select, and nested issue paths', async ({ page }) => {
  await page.goto('/konten/pages');
  await expect(page.getByRole('heading', { level: 2, name: 'Beranda' })).toBeVisible();
  // Kontrol pertama dengan label ini adalah home.hero.cta.route.
  const route = page.locator('[id="f-home-2e-hero-2e-cta-2e-route"]');
  await expect(route).toHaveAccessibleName('Halaman tujuan');
  await expect(route).toHaveValue('contact');
  await expect(route.locator('option')).toHaveText(['Layanan', 'Portofolio', 'Riset / Wawasan', 'Tentang kami', 'Karier', 'Kontak']);
  const hero = page.locator('fieldset.group', { has: page.locator('legend', { hasText: 'Banner utama' }) });
  const title = hero.getByLabel('Judul, Indonesia', { exact: true });
  const before = await title.inputValue();
  await title.fill('Mengelola properti dengan promind');
  await waitSaved(page);
  await expect(page.locator('.issue-summary')).toContainText('Beranda › Banner utama › Judul › Indonesia');
  await expect(page.locator('.issue-summary')).toContainText('Penulisan brand salah');
  await title.fill(before);
  await waitSaved(page);
  await page.getByRole('button', { name: 'Buang draf' }).click();
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).getByRole('button', { name: 'Ya, buang draf' }).click();
  await expect(page.locator('.page-head')).toContainText('Sama dengan situs');
});
