import { expect, test, type Page } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { ROUTES, careerPath, pathFor, type RouteKey } from '../../src/i18n/routes';
import { readContent } from './content';

const jobs = readContent<any[]>('careers').filter((j) => j.active);
const services = readContent<any[]>('services');

async function ld(page: Page): Promise<any[]> {
  const blocks = page.locator('script[type="application/ld+json"]');
  await expect(blocks).toHaveCount(1);
  const data = JSON.parse((await blocks.textContent())!);
  return Array.isArray(data) ? data : [data];
}
const types = (items: any[]) => items.map((i) => i['@type']);

for (const lang of LOCALES) {
  test(`every ${lang} page has one valid JSON-LD block with the organization`, async ({ page }) => {
    for (const key of Object.keys(ROUTES) as RouteKey[]) {
      await page.goto(pathFor(key, lang));
      const items = await ld(page);
      expect(types(items), key).toContain('ProfessionalService');
      if (key !== 'home') expect(types(items), key).toContain('BreadcrumbList');
    }
  });

  test(`${lang} services page describes each service`, async ({ page }) => {
    await page.goto(pathFor('services', lang));
    expect(types(await ld(page)).filter((t) => t === 'Service')).toHaveLength(services.length);
  });

  test(`${lang} job pages carry a JobPosting`, async ({ page }) => {
    for (const j of jobs) {
      await page.goto(careerPath(j.slug, lang));
      const items = await ld(page);
      const posting = items.find((i) => i['@type'] === 'JobPosting');
      expect(posting.title, j.slug).toBe(j.title[lang]);
      expect(posting.datePosted).toBe(j.postedAt);
      expect(types(items)).toContain('BreadcrumbList');
    }
  });
}

test('llms.txt is served as plain text and starts with the brand', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/plain');
  expect(await res.text()).toMatch(/^# PROMIND\n/);
});
