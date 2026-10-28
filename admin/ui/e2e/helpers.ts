import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type APIRequestContext, type Locator, type Page } from '@playwright/test';

export const BASE_URL = 'http://127.0.0.1:8788';
export const PASSWORD = 'Sangat-Rahasia-2026';
export const AUTH = {
  admin: `${import.meta.dirname}/.auth/admin.json`,
  editor: `${import.meta.dirname}/.auth/editor.json`,
};

/**
 * `test` dengan penjaga otomatis di setiap halaman: gagal bila ada pelanggaran CSP, galat JavaScript,
 * atau permintaan ke luar origin admin.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ context }, use) => {
      const problems: string[] = [];
      await context.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          console.error(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI}`);
        });
      });
      const watch = (page: Page) => {
        page.on('console', (m) => {
          const t = m.text();
          if (/Content Security Policy|CSP violation|Refused to/i.test(t)) problems.push(`console: ${t}`);
        });
        page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
        page.on('request', (r) => {
          const u = r.url();
          if (!u.startsWith(BASE_URL) && !u.startsWith('data:') && !u.startsWith('blob:')) problems.push(`external request: ${u}`);
        });
      };
      context.pages().forEach(watch);
      context.on('page', watch);
      await use();
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Kode TOTP segar untuk pengguna uji (server uji menunggu langkah berikutnya bila kode sudah dipakai). */
export async function codeFor(request: APIRequestContext, email: string): Promise<string> {
  const r = await request.get(`${BASE_URL}/__test/code?email=${encodeURIComponent(email)}`, { timeout: 45_000 });
  return ((await r.json()) as { code: string }).code;
}

/** Kode TOTP untuk kunci yang dibaca dari layar (dihitung server uji dengan modul totp Worker). */
export async function codeFromSecret(request: APIRequestContext, secret: string): Promise<string> {
  const r = await request.get(`${BASE_URL}/__test/code-for-secret?secret=${encodeURIComponent(secret.replace(/\s+/g, ''))}`);
  return ((await r.json()) as { code: string }).code;
}

export async function login(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByLabel('Kode verifikasi (6 angka)').fill(await codeFor(page.request, email));
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible();
}

/** axe-core: semua tingkat dampak, nol pelanggaran. */
export async function expectAccessible(page: Page, label: string): Promise<void> {
  const r = await new AxeBuilder({ page }).analyze();
  const summary = r.violations.map((v) => `${label}: [${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join('\n  ')}`).join('\n');
  expect(r.violations, summary).toEqual([]);
}

/** Tidak ada gulir horizontal di tingkat halaman. */
export async function expectNoOverflow(page: Page, label: string): Promise<void> {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, `${label}: page is ${o.sw}px wide in a ${o.cw}px viewport`).toBeLessThanOrEqual(o.cw);
}

/** JPEG valid buatan canvas browser, sebagai buffer untuk setInputFiles. `noise` membuat berkas besar. */
export async function makeJpeg(page: Page, width: number, height: number, opts: { noise?: boolean; quality?: number } = {}): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ width, height, noise, quality }) => {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d')!;
      if (noise) {
        const img = ctx.createImageData(width, height);
        for (let i = 0; i < img.data.length; i++) img.data[i] = (Math.random() * 256) | 0;
        ctx.putImageData(img, 0, 0);
      } else {
        ctx.fillStyle = '#2b5caf';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#f6f5f1';
        ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
      }
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', quality));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    },
    { width, height, noise: opts.noise ?? false, quality: opts.quality ?? 0.9 },
  );
  return Buffer.from(b64, 'base64');
}

export async function screenshot(page: Page, name: string): Promise<void> {
  const dir = process.env.SHOTS_DIR ?? `${import.meta.dirname}/../test-results/screens`;
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

/** Buka menu tindakan sebuah baris pengguna lalu pilih satu butir. */
export async function rowAction(row: Locator, userName: string, item: string): Promise<void> {
  await row.getByRole('button', { name: `Tindakan untuk ${userName}` }).click();
  await row.page().getByRole('menuitem', { name: item }).click();
}
