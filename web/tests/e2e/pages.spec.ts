import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';

const pages = readContent('pages');
const services = readContent<any[]>('services');
const engagement = readContent<any[]>('engagement');
const portfolio = readContent<any[]>('portfolio');
const clients = readContent<any[]>('clients');

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
}
