import { LOCALES, htmlLang, isLocale, type Locale } from './locales';

export type RouteKey =
  | 'home'
  | 'services'
  | 'portfolio'
  | 'research'
  | 'about'
  | 'careers'
  | 'contact';

export const ROUTES: Record<RouteKey, Record<Locale, string>> = {
  home: { id: '', en: '' },
  services: { id: 'layanan', en: 'services' },
  portfolio: { id: 'portofolio', en: 'portfolio' },
  research: { id: 'riset', en: 'research' },
  about: { id: 'tentang-kami', en: 'about' },
  careers: { id: 'karir', en: 'careers' },
  contact: { id: 'kontak', en: 'contact' },
};

export function pathFor(key: RouteKey, lang: Locale): string {
  const slug = ROUTES[key][lang];
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

export function resolveRoute(lang: string, slug: string | undefined): RouteKey | null {
  if (!isLocale(lang)) return null;
  const wanted = slug ?? '';
  const match = (Object.keys(ROUTES) as RouteKey[]).find((k) => ROUTES[k][lang] === wanted);
  return match ?? null;
}

export function alternates(key: RouteKey, siteUrl: string): { hreflang: string; href: string }[] {
  const base = siteUrl.replace(/\/$/, '');
  return [
    ...LOCALES.map((lang) => ({ hreflang: htmlLang(lang), href: `${base}${pathFor(key, lang)}` })),
    { hreflang: 'x-default', href: `${base}/` },
  ];
}
