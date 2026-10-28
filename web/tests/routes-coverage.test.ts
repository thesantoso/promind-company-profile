import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { LOCALES } from '../src/i18n/locales';
import { ROUTES, pathFor, type RouteKey } from '../src/i18n/routes';

const dist = join(process.cwd(), 'dist');
const file = (urlPath: string) => join(dist, urlPath, 'index.html');

beforeAll(() => {
  execSync('npm run build', { cwd: process.cwd(), stdio: 'pipe' });
}, 120_000);

describe('built pages', () => {
  const keys = Object.keys(ROUTES) as RouteKey[];

  test.each(keys.flatMap((k) => LOCALES.map((l) => [k, l] as const)))(
    'route %s exists in %s',
    (key, lang) => {
      expect(existsSync(file(pathFor(key, lang)))).toBe(true);
    },
  );

  test('unknown prefixes and slugs produce no page', () => {
    expect(existsSync(file('/id/xyz/'))).toBe(false);
    expect(existsSync(file('/fr/'))).toBe(false);
    expect(existsSync(file('/en/layanan/'))).toBe(false);
  });

  test('a 404 page exists and is noindex', () => {
    const html = readFileSync(join(dist, '404.html'), 'utf8');
    expect(html).toContain('noindex');
  });

  test('root page links to both languages without needing JavaScript', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    expect(html).toContain('href="/id/"');
    expect(html).toContain('href="/en/"');
  });
});
