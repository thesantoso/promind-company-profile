import type { Job, Service, SiteSettings } from '../content/schema';
import type { Pages } from '../content/schema';
import { LOCALES, type Locale } from '../i18n/locales';
import { ROUTES, pathFor, type RouteKey } from '../i18n/routes';

type Ld = Record<string, unknown>;
const origin = (siteUrl: string) => siteUrl.replace(/\/$/, '');
const orgId = (siteUrl: string) => `${origin(siteUrl)}/#organization`;

export function organizationLd(lang: Locale, s: SiteSettings, siteUrl: string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': orgId(siteUrl),
    name: s.legalName,
    alternateName: s.brand,
    url: `${origin(siteUrl)}${pathFor('home', lang)}`,
    email: s.email,
    telephone: s.phone,
    address: { '@type': 'PostalAddress', streetAddress: s.address[lang], addressCountry: 'ID' },
    availableLanguage: ['id', 'en'],
  };
}

export function serviceLd(service: Service, lang: Locale, siteUrl: string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title[lang],
    description: service.summary[lang],
    provider: { '@id': orgId(siteUrl) },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], siteUrl: string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${origin(siteUrl)}${it.path}`,
    })),
  };
}

const EMPLOYMENT: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  temporary: 'TEMPORARY',
};
export function employmentTypeFor(type: string): string {
  return EMPLOYMENT[type.trim().toLowerCase()] ?? 'OTHER';
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const html = (summary: string, groups: [string, string[]][]) =>
  `<p>${esc(summary)}</p>` + groups.map(([h, items]) => `<h3>${esc(h)}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('');

const HEADINGS = {
  id: ['Tanggung Jawab', 'Kualifikasi', 'Benefit'],
  en: ['Responsibilities', 'Qualifications', 'Benefits'],
} as const;

export function jobPostingLd(job: Job, lang: Locale, siteUrl: string, s: SiteSettings): Ld {
  const [r, q, b] = HEADINGS[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title[lang],
    description: html(job.summary[lang], [[r, job.responsibilities[lang]], [q, job.qualifications[lang]], [b, job.benefits[lang]]]),
    datePosted: job.postedAt,
    ...(job.validThrough ? { validThrough: job.validThrough } : {}),
    employmentType: employmentTypeFor(job.type.en),
    directApply: false,
    hiringOrganization: { '@type': 'Organization', name: s.legalName, sameAs: `${origin(siteUrl)}/` },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Jakarta', addressCountry: 'ID' } },
    url: `${origin(siteUrl)}${pathFor('careers', lang)}${job.slug}/`,
  };
}

/** JSON for a <script type="application/ld+json"> block; `<` is escaped so the tag cannot be closed early. */
export function serializeLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const PAGE_KEY: Record<RouteKey, keyof Pages> = {
  home: 'home', services: 'services', portfolio: 'portfolio', research: 'insights', about: 'about', careers: 'careers', contact: 'contact',
};

export function buildLlmsTxt(siteUrl: string, pages: Pages): string {
  const base = origin(siteUrl);
  const sections = LOCALES.map((lang) => {
    const lines = (Object.keys(ROUTES) as RouteKey[]).map((key) => {
      const seo = pages[PAGE_KEY[key]].seo;
      const title = seo.title[lang].replace(/\s*\|\s*PROMIND$|^PROMIND\s*\|\s*/g, '');
      return `- [${title}](${base}${pathFor(key, lang)}): ${seo.description[lang]}`;
    });
    return `## ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}\n\n${lines.join('\n')}`;
  });
  return `# PROMIND\n\n> ${pages.home.seo.description.en}\n\nPT Properti Manajemen Inovasi Indonesia (PROMIND) is an integrated property management consultant and operator in Indonesia. The site is available in Indonesian and English.\n\n${sections.join('\n\n')}\n`;
}
