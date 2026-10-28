import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { LOCALES } from '../../src/i18n/locales';
import { ROUTES, pathFor, type RouteKey } from '../../src/i18n/routes';

const keys = Object.keys(ROUTES) as RouteKey[];
const pages = keys.flatMap((k) => LOCALES.map((l) => ({ key: k, lang: l, path: pathFor(k, l) })));
const csp = /Content-Security-Policy:\s*(.+)/.exec(readFileSync('public/_headers', 'utf8'))![1].trim();

// astro preview ignores _headers, so apply the real CSP to documents and fail on any violation.
async function withCsp(page: Page) {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) violations.push(m.text());
  });
  await page.route('**/*', async (route) => {
    const res = await route.fetch();
    const type = res.headers()['content-type'] ?? '';
    await route.fulfill({
      response: res,
      headers: type.includes('text/html') ? { ...res.headers(), 'content-security-policy': csp } : res.headers(),
    });
  });
  return violations;
}

for (const p of pages) {
  test.describe(`${p.path}`, () => {
    test('is a well-formed localized page with no CSP violations', async ({ page }) => {
      const violations = await withCsp(page);
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang === 'id' ? 'id-ID' : 'en-US');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel=canonical]')).toHaveCount(1);
      await expect(page.locator('link[rel=alternate][hreflang]')).toHaveCount(3);
      // Social preview: a real JPEG at the 1.91:1 Open Graph ratio and at least 1000px wide, not the logo.
      const og = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(og).toMatch(/\.jpg$/);
      const size = await page.evaluate(async (u) => {
        const bmp = await createImageBitmap(await (await fetch(u)).blob());
        return [bmp.width, bmp.height];
      }, new URL(og!).pathname);
      expect(size[0]).toBeGreaterThanOrEqual(1000);
      expect(size[0] / size[1]).toBeCloseTo(1.91, 1);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      // Fonts are only discovered after the CSS is parsed; preloading removes that network hop from LCP.
      await expect(page.locator('link[rel=preload][as=font][type="font/woff2"][crossorigin]')).toHaveCount(2);
      expect(violations).toEqual([]);
    });

    test('has no serious or critical accessibility violations', async ({ page }) => {
      await page.goto(p.path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
        .analyze();
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}

test('unknown language prefix or slug returns 404', async ({ page }) => {
  for (const bad of ['/fr/', '/id/xyz/', '/en/layanan/']) {
    const res = await page.goto(bad);
    expect(res?.status(), bad).toBe(404);
  }
});

test('language switch goes to the translated slug, not the same slug', async ({ page }) => {
  await page.goto('/id/layanan/');
  // Label in Name (WCAG 2.5.3): the accessible name starts with the visible text, so voice control "click EN" works.
  await page.getByRole('link', { name: /^en\b.*Switch to English/i }).click();
  await expect(page).toHaveURL(/\/en\/services\/$/);
  await page.getByRole('link', { name: /^id\b.*Beralih ke Bahasa Indonesia/i }).click();
  await expect(page).toHaveURL(/\/id\/layanan\/$/);
});

test('header stays solid white, never translucent or blurred, also after scrolling', async ({ page }) => {
  await page.goto('/id/');
  await page.evaluate(() => { document.body.style.minHeight = '3000px'; });
  const read = () =>
    page.locator('header.site-header').evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, blur: s.backdropFilter, opacity: s.opacity };
    });
  const expected = { bg: 'rgb(255, 255, 255)', blur: 'none', opacity: '1' };
  expect(await read()).toEqual(expected);
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => window.scrollY > 300);
  expect(await read()).toEqual(expected);
});

test('mobile menu opens with the keyboard and shows a focus outline', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/en/');
  const summary = page.locator('summary', { hasText: 'Open menu' });
  const nav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(nav).toBeHidden();
  await summary.focus();
  const outline = await summary.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect(nav).toBeVisible();
});

test('reduced motion turns smooth scrolling off', async ({ page }) => {
  await page.goto('/id/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('root chooser works without JavaScript', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.getByRole('link', { name: 'Bahasa Indonesia' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
  await ctx.close();
});

test('root redirects once, by browser language', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page).toHaveURL(/\/en\/$/);
  await ctx.close();
  const ctx2 = await browser.newContext({ locale: 'id-ID' });
  const p2 = await ctx2.newPage();
  await p2.goto('http://127.0.0.1:4321/');
  await expect(p2).toHaveURL(/\/id\/$/);
  await ctx2.close();
});

test('no request goes to Google Fonts', async ({ page }) => {
  const hosts: string[] = [];
  page.on('request', (r) => hosts.push(new URL(r.url()).hostname));
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  expect(hosts.filter((h) => h.includes('googleapis') || h.includes('gstatic'))).toEqual([]);
});
