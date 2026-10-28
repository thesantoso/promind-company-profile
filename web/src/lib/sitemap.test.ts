import { describe, expect, test } from 'vitest';
import { LOCALES } from '../i18n/locales';
import { ROUTES, pathFor, type RouteKey } from '../i18n/routes';
import { buildRobots, buildSitemap } from './sitemap';

const SITE = 'https://promind.co.id';

describe('buildSitemap', () => {
  const xml = buildSitemap(SITE);

  test('has one url per route per language', () => {
    expect(xml.match(/<loc>/g)).toHaveLength(14);
  });

  test('every url lists id-ID, en-US and x-default alternates', () => {
    const blocks = xml.split('<url>').slice(1);
    expect(blocks).toHaveLength(14);
    for (const b of blocks) {
      expect(b).toContain('hreflang="id-ID"');
      expect(b).toContain('hreflang="en-US"');
      expect(b).toContain('hreflang="x-default"');
    }
  });

  test('every loc is a real route and every alternate href is itself listed', () => {
    const expected = (Object.keys(ROUTES) as RouteKey[]).flatMap((k) =>
      LOCALES.map((l) => `${SITE}${pathFor(k, l)}`),
    );
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual([...expected].sort());
    const hrefs = [...xml.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    for (const h of hrefs) expect(locs, h).toContain(h);
  });

  test('a site URL with a trailing slash yields the same sitemap and robots', () => {
    expect(buildSitemap(`${SITE}/`)).toBe(xml);
    expect(buildRobots(`${SITE}/`)).toBe(buildRobots(SITE));
  });
});

describe('buildRobots', () => {
  const txt = buildRobots(SITE);

  test('points to the sitemap', () => {
    expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  test('welcomes search and AI crawlers and blocks nothing', () => {
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(txt).toMatch(new RegExp(`User-agent: ${bot}\\nAllow: /`));
    }
    expect(txt).not.toMatch(/Disallow:\s*\/\s*$/m);
  });
});
