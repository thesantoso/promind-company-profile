import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';

const pages = readContent('pages');
const loadFieldwork = () => readContent<any[]>('fieldwork');
const loadPillars = () => readContent<any[]>('pillars');
const loadPropertyTypes = () => readContent<any[]>('property-types');

for (const lang of LOCALES) {
  test.describe(`home (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('home', lang));
    });

    test('has one h1 and one call to action pointing to contact', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.home.hero.title[lang]);
      const cta = page.locator('[data-hero] a');
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute('href', pathFor('contact', lang));
      await expect(cta).toHaveText(pages.home.hero.cta.label[lang]);
    });

    test('only the hero photo loads eagerly, and it has high fetch priority', async ({ page }) => {
      const eager = page.locator('main img:not([loading=lazy])');
      await expect(eager).toHaveCount(1);
      await expect(eager).toHaveAttribute('fetchpriority', 'high');
      await expect(eager).toHaveAttribute('alt', /\w{10,}/);
    });

    test('shows the sections in order with all their content', async ({ page }) => {
      const h2 = await page.locator('main h2').allTextContents();
      expect(h2).toEqual([
        pages.home.focus.title[lang],
        pages.home.sectors.title[lang],
        pages.home.fieldwork.title[lang],
        pages.home.technology.title[lang],
      ]);
      for (const p of loadPillars()) await expect(page.getByText(p.title[lang], { exact: true })).toBeVisible();
      for (const s of loadPropertyTypes()) await expect(page.getByText(s.title[lang], { exact: true }).first()).toBeVisible();
      const photos = page.locator('main figure img');
      await expect(photos).toHaveCount(loadFieldwork().length);
      for (const f of loadFieldwork()) await expect(page.locator(`main figure img[alt="${f.image.alt[lang]}"]`)).toHaveCount(1);
      for (const s of pages.home.technology.steps) await expect(page.getByText(s.title[lang], { exact: true })).toBeVisible();
    });

    test('has no number badges', async ({ page }) => {
      const texts = await page.locator('main *').evaluateAll((els) =>
        els.filter((e) => e.children.length === 0).map((e) => (e.textContent ?? '').trim()),
      );
      expect(texts.filter((t) => /^\d{1,2}$/.test(t))).toEqual([]);
    });

    test('does not overflow horizontally on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
