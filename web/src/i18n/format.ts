import type { Locale } from './locales';

const INTL_LOCALE: Record<Locale, string> = { id: 'id-ID', en: 'en-US' };

export function formatDate(d: Date | string, lang: Locale): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatNumber(n: number, lang: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[lang]).format(n);
}

export function formatIDR(n: number, lang: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[lang], {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: lang === 'id' ? 'symbol' : 'code',
    maximumFractionDigits: 0,
  }).format(n);
}
