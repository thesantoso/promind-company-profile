import { mkdirSync } from 'node:fs';
import { AUTH, login, test } from './helpers';

test('sign in the shared admin and editor sessions', async ({ page, browser }) => {
  mkdirSync(`${import.meta.dirname}/.auth`, { recursive: true });
  await login(page, 'admin@promind.co.id');
  await page.context().storageState({ path: AUTH.admin });
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const p2 = await ctx.newPage();
  await login(p2, 'editor@promind.co.id');
  await ctx.storageState({ path: AUTH.editor });
  await ctx.close();
});
