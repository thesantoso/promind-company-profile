import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { pathFor, type RouteKey } from '../i18n/routes';
// @ts-expect-error plain JS worker
import worker from '../../worker/index.js';

const rules = readFileSync(join(process.cwd(), 'public', '_redirects'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/) as [string, string, string]);
const find = (from: string) => rules.find((r) => r[0] === from);

describe('legacy URL redirects (old Vite SPA clean paths)', () => {
  const old: [string, RouteKey][] = [
    ['/services', 'services'], ['/portfolio', 'portfolio'], ['/research', 'research'],
    ['/about', 'about'], ['/careers', 'careers'], ['/contact', 'contact'],
  ];
  test.each(old)('%s redirects 301 to the Indonesian page', (from, key) => {
    expect(find(from)).toEqual([from, pathFor(key, 'id'), '301']);
  });
  test('an old career detail path keeps its slug', () => {
    expect(find('/careers/:slug')).toEqual(['/careers/:slug', '/id/karir/:slug/', '301']);
  });
  test('every rule is a 301', () => {
    for (const r of rules) expect(r[2]).toBe('301');
  });
});

describe('public worker host handling', () => {
  const env = { ASSETS: { fetch: async () => new Response('asset') }, ADMIN: { fetch: async () => new Response('admin') } };
  test('www is redirected 301 to the apex, keeping path and query', async () => {
    const res = await worker.fetch(new Request('https://www.promind.co.id/id/karir/?x=1'), env);
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://promind.co.id/id/karir/?x=1');
  });
  test('the apex is served from assets', async () => {
    const res = await worker.fetch(new Request('https://promind.co.id/id/'), env);
    expect(await res.text()).toBe('asset');
  });
  test('staging host is never redirected', async () => {
    const res = await worker.fetch(new Request('https://staging.promind.co.id/id/'), env);
    expect(await res.text()).toBe('asset');
  });
});
