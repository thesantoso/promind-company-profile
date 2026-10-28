import { describe, expect, test } from 'vitest';
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

  test('never lists the 404 page', () => {
    expect(xml).not.toContain('404');
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
