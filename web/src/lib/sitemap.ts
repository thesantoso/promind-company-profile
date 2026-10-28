import { LOCALES, type Locale } from '../i18n/locales';
import { ROUTES, alternatesFromPaths, pathsFor, type RouteKey } from '../i18n/routes';

const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export function buildSitemap(siteUrl: string, extraPaths: Record<Locale, string>[] = []): string {
  const base = siteUrl.replace(/\/$/, '');
  const entries = [...(Object.keys(ROUTES) as RouteKey[]).map(pathsFor), ...extraPaths];
  const urls = entries.flatMap((paths) =>
    LOCALES.map((lang) => {
      const links = alternatesFromPaths(paths, base)
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
        .join('\n');
      return `  <url>\n    <loc>${base}${paths[lang]}</loc>\n${links}\n  </url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

export function buildRobots(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const bots = AI_CRAWLERS.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n');
  return `User-agent: *\nAllow: /\n\n${bots}\n\nSitemap: ${base}/sitemap.xml\n`;
}
