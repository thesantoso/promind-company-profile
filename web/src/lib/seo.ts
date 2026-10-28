import { htmlLang, type Locale } from '../i18n/locales';
import { alternatesFromPaths, pathsFor, type RouteKey } from '../i18n/routes';

export interface SeoInput {
  lang: Locale;
  routeKey: RouteKey;
  title: string;
  description: string;
  siteUrl: string;
  ogImage: string;
  /** Per-language paths for dynamic pages (e.g. a job); defaults to the route table. */
  paths?: Record<Locale, string>;
}

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  alternates: { hreflang: string; href: string }[];
  og: {
    title: string;
    description: string;
    url: string;
    image: string;
    locale: 'id_ID' | 'en_US';
    type: 'website';
  };
}

export function buildSeo(i: SeoInput): SeoMeta {
  const base = i.siteUrl.replace(/\/$/, '');
  const paths = i.paths ?? pathsFor(i.routeKey);
  const canonical = `${base}${paths[i.lang]}`;
  return {
    title: i.title,
    description: i.description,
    canonical,
    alternates: alternatesFromPaths(paths, base),
    og: {
      title: i.title,
      description: i.description,
      url: canonical,
      image: i.ogImage,
      locale: htmlLang(i.lang).replace('-', '_') as 'id_ID' | 'en_US',
      type: 'website',
    },
  };
}
