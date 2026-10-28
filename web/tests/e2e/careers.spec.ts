import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { careerPath, pathFor } from '../../src/i18n/routes';
import { readContent } from './content';

const pages = readContent('pages');
const today = new Date().toISOString().slice(0, 10);
const jobs = readContent<any[]>('careers').filter((j) => j.active && (!j.validThrough || j.validThrough >= today));

for (const lang of LOCALES) {
  test.describe(`careers (${lang})`, () => {
    test('lists only open roles and the culture points', async ({ page }) => {
      await page.goto(pathFor('careers', lang));
      await expect(page.locator('main h1')).toHaveText(pages.careers.title[lang]);
      const roles = page.locator('[data-roles] > li');
      await expect(roles).toHaveCount(jobs.length);
      for (const j of jobs) {
        const link = page.locator(`[data-roles] a[href="${careerPath(j.slug, lang)}"]`);
        await expect(link).toHaveText(j.title[lang]);
      }
      for (const c of pages.careers.culture) await expect(page.getByText(c.title[lang], { exact: true })).toBeVisible();
    });

    for (const j of jobs) {
      test(`job page ${j.slug}`, async ({ page }) => {
        await page.goto(careerPath(j.slug, lang));
        await expect(page.locator('main h1')).toHaveText(j.title[lang]);
        for (const key of ['responsibilities', 'qualifications', 'benefits']) {
          await expect(page.locator(`[data-list=${key}] li`)).toHaveCount(j[key][lang].length);
        }
        const apply = page.locator('[data-apply] a');
        await expect(apply).toHaveCount(1);
        await expect(apply).toHaveAttribute('href', new RegExp(`^mailto:${j.applicationEmail}\\?subject=`));
        await expect(page.locator('html')).toHaveAttribute('lang', lang === 'id' ? 'id-ID' : 'en-US');
      });

      test(`language switch on ${j.slug} goes to the same job in the other language`, async ({ page }) => {
        await page.goto(careerPath(j.slug, lang));
        const other = lang === 'id' ? 'en' : 'id';
        await page.locator('header a[hreflang]').first().click();
        await expect(page).toHaveURL(new RegExp(`${careerPath(j.slug, other)}$`));
      });
    }
  });
}

test('an unknown job slug is a 404', async ({ page }) => {
  expect((await page.goto('/id/karir/tidak-ada/'))?.status()).toBe(404);
  expect((await page.goto('/en/careers/tidak-ada/'))?.status()).toBe(404);
});
