import { htmlLang, type Locale } from '../i18n/locales';
import { alternates, pathFor, type RouteKey } from '../i18n/routes';

export interface SeoInput {
  lang: Locale;
  routeKey: RouteKey;
  title: string;
  description: string;
  siteUrl: string;
  ogImage?: string;
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
  const canonical = `${base}${pathFor(i.routeKey, i.lang)}`;
  return {
    title: i.title,
    description: i.description,
    canonical,
    alternates: alternates(i.routeKey, base),
    og: {
      title: i.title,
      description: i.description,
      url: canonical,
      image: i.ogImage ?? `${base}/images/promind-header-brand.png`,
      locale: htmlLang(i.lang).replace('-', '_') as 'id_ID' | 'en_US',
      type: 'website',
    },
  };
}
