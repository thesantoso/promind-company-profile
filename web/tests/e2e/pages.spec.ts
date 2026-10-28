import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';
import { expectNoNumberBadges } from './helpers';

const pages = readContent('pages');
const services = readContent<any[]>('services');
const engagement = readContent<any[]>('engagement');
const portfolio = readContent<any[]>('portfolio');
const insights = readContent<any[]>('insights');
const pillars = readContent<any[]>('pillars');
const standards = readContent<any[]>('standards');
const settings = readContent('settings');

for (const lang of LOCALES) {
  test.describe(`services (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('services', lang));
    });

    test('lists every service with its numbered scope of work', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.services.title[lang]);
      for (const s of services) {
        const article = page.locator(`article#${s.slug}`);
        await expect(article.locator('h2')).toHaveText(s.title[lang]);
        await expect(article.locator('[data-list=deliverables] li')).toHaveCount(s.deliverables[lang].length);
        for (const d of s.deliverables[lang]) await expect(article.getByText(d, { exact: true })).toBeVisible();
      }
      await expectNoNumberBadges(page);
    });

    test('shows the four engagement models and one call to action', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 2, name: pages.services.engagementTitle[lang] })).toBeVisible();
      for (const e of engagement) await expect(page.getByText(e.title[lang], { exact: true })).toBeVisible();
      const cta = page.locator('section.engagement a.button');
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute('href', pathFor('contact', lang));
    });
  });

  test.describe(`portfolio (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('portfolio', lang));
    });

    test('lists all 12 projects with their sector', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.portfolio.title[lang]);
      await expect(page.getByRole('heading', { level: 2, name: pages.portfolio.clientsTitle[lang] })).toBeVisible();
      const items = page.locator('[data-projects] > li');
      await expect(items).toHaveCount(portfolio.length);
      for (const p of portfolio) {
        const item = items.filter({ has: page.getByRole('heading', { level: 3, name: p.name, exact: true }) });
        await expect(item).toBeVisible();
        await expect(item).toContainText(p.sector[lang]);
      }
    });

    test('category filter works from the keyboard without JavaScript', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:4321${pathFor('portfolio', lang)}`);
      const sectors = [...new Set(portfolio.map((p) => p.sector[lang]))];
      const radios = page.getByRole('radio');
      await expect(radios).toHaveCount(sectors.length + 1);
      await expect(radios.first()).toBeChecked();
      await radios.first().focus();
      await page.keyboard.press('ArrowRight');
      await expect(radios.nth(1)).toBeChecked();
      const visible = page.locator('[data-projects] > li:visible');
      await expect(visible).toHaveCount(portfolio.filter((p) => p.sector[lang] === sectors[0]).length);
      await ctx.close();
    });
  });

  test.describe(`insights (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('research', lang));
    });

    test('shows every article with category, summary and at least three highlights', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.insights.title[lang]);
      for (const i of insights) {
        const article = page.locator(`article#${i.slug}`);
        await expect(article.locator('h2')).toHaveText(i.title[lang]);
        await expect(article).toContainText(i.category[lang]);
        await expect(article).toContainText(i.summary[lang]);
        expect(await article.locator('li').count()).toBeGreaterThanOrEqual(3);
      }
    });

    test('is labelled Wawasan / Insights in the navigation', async ({ page }) => {
      const label = lang === 'id' ? 'Wawasan' : 'Insights';
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: label, exact: true })).toHaveAttribute('href', pathFor('research', lang));
    });
  });

  test.describe(`about (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('about', lang));
    });

    test('tells the story in three paragraphs', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.about.title[lang]);
      for (const para of pages.about.story[lang]) await expect(page.locator('main').getByText(para, { exact: true })).toBeVisible();
    });

    test('lists the five pillars and the standards exactly as migrated', async ({ page }) => {
      for (const p of pillars) await expect(page.getByText(p.title[lang], { exact: true })).toBeVisible();
      const std = page.locator('[data-standards]');
      await expect(std.getByRole('heading', { level: 2 })).toHaveText(pages.about.standardsTitle[lang]);
      await expect(std.locator('h3')).toHaveCount(standards.length);
      for (const s of standards) await expect(std.locator('h3', { hasText: s.code })).toBeVisible();
    });
  });

  test.describe(`contact (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('contact', lang));
    });

    test('shows the company email in the page and the office address in the footer', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.contact.title[lang]);
      await expect(page.locator('footer address')).toHaveText(settings.address[lang]);
      await expect(page.locator(`footer a[href="mailto:${settings.email}"]`)).toBeVisible();
    });

    test('offers the six service areas and the property types in the form', async ({ page }) => {
      await expect(page.locator('select[name=topic] option')).toHaveCount(pages.contact.serviceAreas[lang].length);
      await expect(page.locator('select[name=propertyType] option')).toHaveCount(pages.contact.propertyTypes[lang].length);
    });

    test('has one email link beside the form, which has its own submit button', async ({ page }) => {
      const cta = page.locator('[data-cta]');
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute('href', `mailto:${settings.email}`);
      await expect(cta).toHaveText(settings.email);
      await expect(page.locator('main form')).toHaveCount(1);
    });
  });
}
