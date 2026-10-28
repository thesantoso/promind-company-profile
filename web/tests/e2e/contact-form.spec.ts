import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pathFor } from '../../src/i18n/routes';
import { readContent } from './content';

const settings = readContent('settings');
const pages = readContent('pages');

const STUB = `document.querySelectorAll('.cf-turnstile').forEach(function (el) {
  var i = document.createElement('input'); i.type = 'hidden'; i.name = 'cf-turnstile-response'; i.value = 'TEST-TOKEN'; el.appendChild(i);
}); window.turnstile = { reset: function () {} };`;

async function prepare(page: Page, respond: { status: number; body: unknown } = { status: 200, body: { ok: true } }) {
  const sent: { url: string; body: any }[] = [];
  await page.route('https://challenges.cloudflare.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  await page.route('**/api/contact', async (r) => {
    sent.push({ url: r.request().url(), body: r.request().postDataJSON() });
    await r.fulfill({ status: respond.status, contentType: 'application/json', body: JSON.stringify(respond.body) });
  });
  return sent;
}

for (const lang of ['id', 'en'] as const) {
  const f = pages.contact.form;
  const label = { name: f.name[lang], company: f.company[lang], email: f.email[lang], message: f.message[lang], submit: f.submit[lang] };

  test.describe(`contact form (${lang})`, () => {
    test('shows labelled fields, the topic list from the content, and a hidden honeypot', async ({ page }) => {
      await prepare(page);
      await page.goto(pathFor('contact', lang));
      const form = page.locator('form#contact-form');
      await expect(form).toHaveCount(1);
      for (const l of [label.name, label.company, label.email, label.message]) await expect(form.getByLabel(l, { exact: true })).toBeVisible();
      const options = await form.locator('select[name=topic] option').allTextContents();
      for (const a of pages.contact.serviceAreas[lang]) expect(options).toContain(a);
      const hp = form.locator('input[name=website]');
      await expect(hp).toHaveAttribute('tabindex', '-1');
      await expect(hp).toHaveAttribute('autocomplete', 'off');
      expect(await hp.evaluate((el) => el.getBoundingClientRect().left)).toBeLessThan(-1000);
      await expect(form.locator('.cf-turnstile')).toHaveAttribute('data-sitekey', /.+/);
    });

    test('empty submit shows inline errors and sends nothing', async ({ page }) => {
      const sent = await prepare(page);
      await page.goto(pathFor('contact', lang));
      await page.getByRole('button', { name: label.submit }).click();
      await expect(page.locator('#contact-form [aria-invalid=true]').first()).toBeVisible();
      await expect(page.locator('#contact-form [role=alert]')).toBeVisible();
      expect(sent).toHaveLength(0);
    });

    test('a valid submit posts the fields with the Turnstile token and shows the success message', async ({ page }) => {
      const sent = await prepare(page);
      await page.goto(pathFor('contact', lang));
      const form = page.locator('form#contact-form');
      await form.locator('input[name=name]').fill('Budi Santoso');
      await form.locator('input[name=company]').fill('PT Contoh Properti');
      await form.locator('input[name=email]').fill('budi@example.com');
      await form.locator('input[name=phone]').fill('+62 811-1234-5678');
      await form.locator('select[name=propertyType]').selectOption(pages.contact.propertyTypes[lang][1]);
      await form.locator('textarea[name=message]').fill('Kami ingin mendiskusikan pengelolaan gedung kami.');
      await form.getByRole('button', { name: label.submit }).click();
      await expect(page.locator('#contact-form [data-status=success]')).toBeVisible();
      expect(sent).toHaveLength(1);
      expect(sent[0]!.url).toMatch(/\/api\/contact$/);
      expect(sent[0]!.body).toMatchObject({ name: 'Budi Santoso', email: 'budi@example.com', phone: '+62 811-1234-5678', lang, turnstileToken: 'TEST-TOKEN', website: '' });
      expect(sent[0]!.body.topic).toBe(pages.contact.serviceAreas[lang][0]);
      expect(sent[0]!.body.message).toBe(
        `${label.company}: PT Contoh Properti\n${f.propertyType[lang]}: ${pages.contact.propertyTypes[lang][1]}\n\nKami ingin mendiskusikan pengelolaan gedung kami.`,
      );
      await expect(form.locator('input[name=name]')).toHaveValue('');
    });

  });
}

test.describe('error responses', () => {
  for (const [status, key] of [[429, 'rate'], [502, 'unavailable'], [400, 'failed']] as const) {
    test(`HTTP ${status} shows a friendly message, keeps the typed text, and offers the email address`, async ({ page }) => {
      await prepare(page, { status, body: { error: 'x' } });
      await page.goto(pathFor('contact', 'en'));
      const form = page.locator('form#contact-form');
      await form.locator('input[name=name]').fill('Budi');
      await form.locator('input[name=company]').fill('Example Properties');
      await form.locator('input[name=email]').fill('budi@example.com');
      await form.locator('input[name=phone]').fill('+62 811 1234 5678');
      await form.locator('textarea[name=message]').fill('Please contact us about management.');
      await form.getByRole('button', { name: pages.contact.form.submit.en }).click();
      const err = form.locator(`[data-status=error-${key}]`);
      await expect(err).toBeVisible();
      await expect(err.locator(`a[href="mailto:${settings.email}"]`)).toHaveCount(1);
      await expect(form.locator('input[name=name]')).toHaveValue('Budi');
      await expect(form.getByRole('button', { name: pages.contact.form.submit.en })).toBeEnabled();
    });
  }
});

test('the contact page has no accessibility violations with the form', async ({ page }) => {
  await prepare(page);
  for (const lang of ['id', 'en'] as const) {
    await page.goto(pathFor('contact', lang));
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.impact} ${v.id}`)).toEqual([]);
  }
});
