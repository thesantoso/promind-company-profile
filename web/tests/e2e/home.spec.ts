import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';
import { expectNoNumberBadges } from './helpers';

const pages = readContent('pages');
const loadFieldwork = () => readContent<any[]>('fieldwork');
const loadPillars = () => readContent<any[]>('pillars');
const loadPropertyTypes = () => readContent<any[]>('property-types');
const loadServices = () => readContent<any[]>('services');
const loadClients = () => readContent<any[]>('clients');

for (const lang of LOCALES) {
  test.describe(`home (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('home', lang));
    });

    test('has one h1 with the accent highlight, a primary call to action and one secondary link', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.home.hero.title[lang]);
      await expect(page.locator('main h1 em')).toHaveText(pages.home.hero.titleHighlight[lang]);
      const cta = page.locator('[data-hero] a.button');
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute('href', pathFor('contact', lang));
      await expect(cta).toHaveText(pages.home.hero.cta.label[lang]);
      const secondary = page.locator('[data-hero] a.text-link');
      await expect(secondary).toHaveCount(1);
      await expect(secondary).toHaveAttribute('href', pathFor(pages.home.hero.secondaryLink.route, lang));
    });

    test('only the hero skyline photo loads eagerly, with high fetch priority', async ({ page }) => {
      const eager = page.locator('main img:not([loading=lazy])');
      await expect(eager).toHaveCount(1);
      await expect(eager).toHaveAttribute('fetchpriority', 'high');
      await expect(eager).toHaveAttribute('alt', pages.home.hero.imageAlt[lang]);
      await expect(eager).toHaveAttribute('src', /main-hero/);
    });

    test('shows the live sections in order with all their content', async ({ page }) => {
      const h2 = await page.locator('main h2').allTextContents();
      expect(h2).toEqual([
        pages.home.focus.title[lang],
        pages.home.sectors.title[lang],
        pages.services.title[lang],
        pages.home.fieldwork.title[lang],
        pages.home.technology.title[lang],
        pages.home.clients.title[lang],
        pages.home.contact.title[lang],
      ]);
      for (const p of loadPillars()) await expect(page.getByText(p.title[lang], { exact: true })).toBeVisible();
      for (const s of loadPropertyTypes()) await expect(page.getByText(s.title[lang], { exact: true }).first()).toBeVisible();
      await expect(page.locator('.service-row')).toHaveCount(loadServices().length);
      const photos = page.locator('main figure img');
      await expect(photos).toHaveCount(loadFieldwork().length);
      for (const f of loadFieldwork()) await expect(page.locator(`main figure img[alt="${f.image.alt[lang]}"]`)).toHaveCount(1);
      for (const s of pages.home.technology.steps) await expect(page.getByText(s.title[lang], { exact: true })).toBeVisible();
    });

    test('shows the client logo wall, with every client name available to assistive technology', async ({ page }) => {
      await expect(page.locator('.client-marquee img[alt]:not([alt=""])')).toHaveCount(1);
      await expect(page.locator('.client-marquee img[alt=""]')).toHaveCount(1);
      const names = page.locator('[data-clients] li');
      await expect(names).toHaveCount(loadClients().length);
      for (const c of loadClients()) await expect(names.filter({ hasText: c.name }).first()).toHaveCount(1);
    });

    test('the client marquee can be paused from the keyboard', async ({ page }) => {
      const toggle = page.locator('.marquee-toggle');
      await toggle.focus();
      await page.keyboard.press('Space');
      await expect(toggle).toBeChecked();
      expect(await page.locator('.client-marquee-track').evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
    });

    test('the blue contact band has one call to action to the contact page', async ({ page }) => {
      const band = page.locator('section.contact');
      await expect(band.locator('a.button')).toHaveCount(1);
      await expect(band.locator('a.button')).toHaveAttribute('href', pathFor('contact', lang));
    });

    test('has plain ordinal labels, never number badges', async ({ page }) => {
      await expectNoNumberBadges(page);
    });

    test('does not overflow horizontally on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
