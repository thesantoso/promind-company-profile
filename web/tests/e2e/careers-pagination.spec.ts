import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { pathFor } from '../../src/i18n/routes';
import { UI } from '../../src/i18n/ui';
import { todayUtc } from '../../src/lib/today';
import { readContent } from './content';

// Production has five open roles, so the live pagination (5 per page, controls only above that) never
// shows. These tests rewrite the careers page HTML in flight: they append copies of the last role and/or
// set data-page-size on the list, which is what the page script reads. Production content is untouched.
const today = todayUtc();
const jobs = readContent<any[]>('careers').filter((j) => j.active && (!j.validThrough || j.validThrough >= today));

async function careers(page: Page, lang: (typeof LOCALES)[number], { extra = 0, pageSize }: { extra?: number; pageSize?: number } = {}) {
  const path = pathFor('careers', lang);
  await page.route(`**${path}`, async (route) => {
    const res = await route.fetch();
    let html = await res.text();
    html = html.replace(/(<ul data-roles[^>]*?)data-page-size="\d+"/, (_m, head) => `${head}data-page-size="${pageSize ?? 5}"`);
    if (extra) {
      const rows = html.match(/<li data-g[\s\S]*?<\/li>/g)!;
      html = html.replace('</ul>', rows[rows.length - 1].repeat(extra) + '</ul>');
    }
    await route.fulfill({ response: res, body: html });
  });
  await page.goto(path);
}

const summary = (lang: (typeof LOCALES)[number], start: number, end: number, total: number) =>
  UI[lang]['careers.summary'].replace('{start}', String(start)).replace('{end}', String(end)).replace('{total}', String(total));

for (const lang of LOCALES) {
  test.describe(`careers pagination (${lang})`, () => {
    const roles = (page: Page) => page.locator('[data-roles] > li:not([hidden])');
    const pager = (page: Page) => page.locator('[data-pager]');
    const prev = (page: Page) => pager(page).getByRole('button', { name: UI[lang]['careers.prev'] });
    const next = (page: Page) => pager(page).getByRole('button', { name: UI[lang]['careers.next'] });

    test('five open roles: all shown, no controls', async ({ page }) => {
      await page.goto(pathFor('careers', lang));
      await expect(roles(page)).toHaveCount(jobs.length);
      await expect(pager(page)).toBeHidden();
    });

    test('more than five roles: five per page with the live summary and controls', async ({ page }) => {
      const extra = 7 - jobs.length;
      await careers(page, lang, { extra });
      await expect(roles(page)).toHaveCount(5);
      await expect(pager(page)).toBeVisible();
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 1, 5, 7));
      await expect(pager(page).locator('.career-page-num-btn')).toHaveCount(2);
      await expect(pager(page).locator('.career-page-num-btn.is-active')).toHaveText('1');
      await expect(pager(page).locator('.career-page-num-btn.is-active')).toHaveAttribute('aria-current', 'page');
      await expect(prev(page)).toBeDisabled();
      await expect(next(page)).toBeEnabled();
      await expect(roles(page).first().locator('.text-xs.font-extrabold').first()).toHaveText('01');

      await next(page).click();
      await expect(roles(page)).toHaveCount(2);
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 6, 7, 7));
      await expect(roles(page).first().locator('.text-xs.font-extrabold').first()).toHaveText('06');
      await expect(pager(page).locator('.career-page-num-btn.is-active')).toHaveText('2');
      await expect(next(page)).toBeDisabled();
      await expect(prev(page)).toBeEnabled();
      // The disabled Next button cannot keep focus: it moves to the current page number.
      await expect(pager(page).locator('.career-page-num-btn.is-active')).toBeFocused();

      await pager(page).getByRole('button', { name: UI[lang]['careers.pageN'].replace('{n}', '1') }).click();
      await expect(roles(page)).toHaveCount(5);
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 1, 5, 7));
    });

    test('keyboard: Enter on Next turns the page', async ({ page }) => {
      await careers(page, lang, { extra: 7 - jobs.length });
      await next(page).focus();
      await page.keyboard.press('Enter');
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 6, 7, 7));
    });

    test('exactly six roles: 1 - 5 of 6, then 6 - 6 of 6', async ({ page }) => {
      await careers(page, lang, { extra: 6 - jobs.length });
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 1, 5, 6));
      await next(page).click();
      await expect(roles(page)).toHaveCount(1);
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 6, 6, 6));
    });

    test('changing the department filter returns to page 1 and counts only that department', async ({ page }) => {
      await careers(page, lang, { pageSize: 2 });
      await expect(pager(page).locator('.career-page-num-btn')).toHaveCount(Math.ceil(jobs.length / 2));
      await next(page).click();
      const departments = [...new Set(jobs.map((j) => j.department.en))];
      const inFirst = jobs.filter((j) => j.department.en === departments[0]).length;
      await page.locator('label[for=department-1]').click();
      await expect(pager(page).locator('.career-page-num-btn.is-active')).toHaveText('1');
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 1, Math.min(2, inFirst), inFirst));
      await expect(roles(page)).toHaveCount(Math.min(2, inFirst));
      await expect(pager(page).locator('.career-page-num-btn')).toHaveCount(Math.ceil(inFirst / 2));
      await expect(pager(page)).toBeVisible({ visible: inFirst > 2 });
      await page.locator('label[for=department-0]').click();
      await expect(pager(page).locator('[data-pager-info]')).toHaveText(summary(lang, 1, 2, jobs.length));
    });

    test('has no accessibility violations with the controls showing', async ({ page }) => {
      await careers(page, lang, { extra: 7 - jobs.length });
      await next(page).click();
      // The buttons transition their colours for 200 ms; axe must not sample mid-transition.
      await page.waitForFunction(() => document.getAnimations().length === 0);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
        .analyze();
      expect(violations.map((v) => `${v.impact} ${v.id}: ${v.help}`)).toEqual([]);
    });

    test('without JavaScript every open role stays visible and links are crawlable', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:4321${pathFor('careers', lang)}`);
      await expect(page.locator('[data-roles] > li:visible')).toHaveCount(jobs.length);
      await expect(page.locator('[data-roles] h3 a')).toHaveCount(jobs.length);
      await expect(pager(page)).toBeHidden();
      await ctx.close();
    });
  });
}
