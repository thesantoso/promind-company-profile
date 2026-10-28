import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';

const pages = readContent('pages');
const services = readContent<any[]>('services');
const engagement = readContent<any[]>('engagement');
const portfolio = readContent<any[]>('portfolio');
const clients = readContent<any[]>('clients');
const insights = readContent<any[]>('insights');
const pillars = readContent<any[]>('pillars');
const standards = readContent<any[]>('standards');
const settings = readContent('settings');

for (const lang of LOCALES) {
  test.describe(`services (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('services', lang));
    });

    test('lists every service with its deliverables as bullets', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.services.title[lang]);
      for (const s of services) {
        const article = page.locator(`article#${s.slug}`);
        await expect(article.locator('h2')).toHaveText(s.title[lang]);
        await expect(article.locator('li')).toHaveCount(s.deliverables[lang].length);
      }
      const bullets = services.reduce((n, s) => n + s.deliverables[lang].length, 0);
      await expect(page.locator('article [aria-hidden=true]', { hasText: '•' })).toHaveCount(bullets);
    });

    test('shows the four engagement models', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 2, name: pages.services.engagementTitle[lang] })).toBeVisible();
      for (const e of engagement) await expect(page.getByText(e.title[lang], { exact: true })).toBeVisible();
    });
  });

  test.describe(`portfolio (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('portfolio', lang));
    });

    test('groups all 12 projects under their sector', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.portfolio.title[lang]);
      const sectors = [...new Set(portfolio.map((p) => p.sector[lang]))];
      for (const sector of sectors) {
        const group = page.locator('section', { has: page.getByRole('heading', { level: 2, name: sector, exact: true }) });
        const expected = portfolio.filter((p) => p.sector[lang] === sector);
        await expect(group.locator('dt')).toHaveCount(expected.length);
        for (const p of expected) await expect(group.locator('dt').filter({ hasText: p.name }).first()).toBeVisible();
      }
    });

    test('lists all 14 clients', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 2, name: pages.portfolio.clientsTitle[lang] })).toBeVisible();
      const items = page.locator('[data-clients] li');
      await expect(items).toHaveCount(clients.length);
      for (const c of clients) await expect(items.filter({ hasText: c.name }).first()).toBeVisible();
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
      const std = page.locator('section', { has: page.getByRole('heading', { level: 2, name: pages.about.standardsTitle[lang] }) });
      await expect(std.locator('dt')).toHaveCount(standards.length);
      for (const s of standards) await expect(std.locator('dt', { hasText: s.code })).toBeVisible();
    });
  });

  test.describe(`contact (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathFor('contact', lang));
    });

    test('shows the company contact details from settings', async ({ page }) => {
      await expect(page.locator('main h1')).toHaveText(pages.contact.title[lang]);
      await expect(page.locator('main address')).toHaveText(settings.address[lang]);
      await expect(page.locator(`main a[href="mailto:${settings.email}"]`).first()).toBeVisible();
      await expect(page.locator(`main a[href="tel:${settings.phone.replace(/\s/g, '')}"]`)).toBeVisible();
    });

    test('lists the six service areas as bullets', async ({ page }) => {
      await expect(page.locator('[data-list=service-areas] li')).toHaveCount(pages.contact.serviceAreas[lang].length);
    });

    test('has exactly one primary call to action and no form yet', async ({ page }) => {
      const cta = page.locator('[data-cta] a');
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute('href', `mailto:${settings.email}`);
      await expect(cta).toHaveText(pages.contact.ctaLabel[lang]);
      await expect(page.locator('main form')).toHaveCount(0);
    });
  });
}
