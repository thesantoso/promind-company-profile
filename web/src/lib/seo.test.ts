import { describe, expect, test } from 'vitest';
import { buildSeo } from './seo';

const SITE = 'https://promind.co.id';
const OG = `${SITE}/_astro/og.abc123.jpg`;
const input = { lang: 'en', routeKey: 'about', title: 'About | PROMIND', description: 'Who we are.', siteUrl: SITE, ogImage: OG } as const;

describe('buildSeo', () => {
  test('canonical is the absolute localized URL with trailing slash', () => {
    expect(buildSeo(input).canonical).toBe(`${SITE}/en/about/`);
    expect(buildSeo({ ...input, lang: 'id' }).canonical).toBe(`${SITE}/id/tentang-kami/`);
  });

  test('includes alternates with x-default', () => {
    const hrefs = buildSeo(input).alternates.map((a) => a.hreflang);
    expect(hrefs).toEqual(['id-ID', 'en-US', 'x-default']);
  });

  test('Open Graph locale follows the language and the image is the one passed in', () => {
    const og = buildSeo(input).og;
    expect(og.locale).toBe('en_US');
    expect(buildSeo({ ...input, lang: 'id' }).og.locale).toBe('id_ID');
    expect(og.image).toBe(OG);
    expect(og.url).toBe(`${SITE}/en/about/`);
  });

  test('tolerates a site URL with a trailing slash', () => {
    expect(buildSeo({ ...input, siteUrl: `${SITE}/` }).canonical).toBe(`${SITE}/en/about/`);
  });

  test('a paths override replaces the route-based canonical and alternates', () => {
    const paths = { id: '/id/karir/building-manager/', en: '/en/careers/building-manager/' };
    const seo = buildSeo({ ...input, routeKey: 'careers', paths });
    expect(seo.canonical).toBe(`${SITE}/en/careers/building-manager/`);
    expect(seo.alternates.map((a) => a.href)).toEqual([
      `${SITE}/id/karir/building-manager/`,
      `${SITE}/en/careers/building-manager/`,
      `${SITE}/id/karir/building-manager/`,
    ]);
    expect(seo.og.url).toBe(seo.canonical);
  });
});
