import { describe, expect, test } from 'vitest';
import { LOCALES, isLocale, htmlLang } from './locales';
import { ROUTES, alternates, pathFor, resolveRoute, type RouteKey } from './routes';

const SITE = 'https://promind.co.id';
const keys = Object.keys(ROUTES) as RouteKey[];

describe('pathFor', () => {
  test('uses translated slugs with trailing slash', () => {
    expect(pathFor('services', 'id')).toBe('/id/layanan/');
    expect(pathFor('services', 'en')).toBe('/en/services/');
    expect(pathFor('home', 'en')).toBe('/en/');
    expect(pathFor('home', 'id')).toBe('/id/');
  });
});

describe('resolveRoute', () => {
  test('maps a slug to its route key in the same language', () => {
    expect(resolveRoute('id', 'layanan')).toBe('services');
    expect(resolveRoute('en', 'services')).toBe('services');
    expect(resolveRoute('id', undefined)).toBe('home');
  });

  test('rejects another language slug and unknown prefixes', () => {
    expect(resolveRoute('en', 'layanan')).toBeNull();
    expect(resolveRoute('fr', 'services')).toBeNull();
    expect(resolveRoute('id', 'xyz')).toBeNull();
  });
});

describe('alternates', () => {
  test('lists both languages and x-default', () => {
    const alts = alternates('about', SITE);
    expect(alts).toContainEqual({ hreflang: 'id-ID', href: `${SITE}/id/tentang-kami/` });
    expect(alts).toContainEqual({ hreflang: 'en-US', href: `${SITE}/en/about/` });
    expect(alts).toContainEqual({ hreflang: 'x-default', href: `${SITE}/id/tentang-kami/` });
  });
});

describe('route table', () => {
  test('slugs are unique within each language', () => {
    for (const lang of LOCALES) {
      const slugs = keys.map((k) => ROUTES[k][lang]);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  test('locale helpers', () => {
    expect(isLocale('id')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(htmlLang('id')).toBe('id-ID');
    expect(htmlLang('en')).toBe('en-US');
  });
});
