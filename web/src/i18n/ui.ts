import type { Locale } from './locales';

export type UiKey =
  | 'nav.home'
  | 'nav.services'
  | 'nav.portfolio'
  | 'nav.research'
  | 'nav.about'
  | 'nav.careers'
  | 'nav.contact'
  | 'nav.menu'
  | 'nav.skip'
  | 'lang.switch'
  | 'lang.choose'
  | 'footer.rights'
  | 'placeholder.soon';

export const UI: Record<Locale, Record<UiKey, string>> = {
  id: {
    'nav.home': 'Beranda',
    'nav.services': 'Layanan',
    'nav.portfolio': 'Portofolio',
    'nav.research': 'Riset',
    'nav.about': 'Tentang Kami',
    'nav.careers': 'Karir',
    'nav.contact': 'Kontak',
    'nav.menu': 'Buka menu',
    'nav.skip': 'Lewati ke konten utama',
    'lang.switch': 'Ganti ke English',
    'lang.choose': 'Pilih bahasa',
    'footer.rights': 'Hak cipta dilindungi.',
    'placeholder.soon': 'Konten halaman ini sedang disiapkan.',
  },
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.portfolio': 'Portfolio',
    'nav.research': 'Research',
    'nav.about': 'About',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.menu': 'Open menu',
    'nav.skip': 'Skip to main content',
    'lang.switch': 'Beralih ke Bahasa Indonesia',
    'lang.choose': 'Choose a language',
    'footer.rights': 'All rights reserved.',
    'placeholder.soon': 'This page is being prepared.',
  },
};

export function t(lang: Locale, key: UiKey): string {
  return UI[lang][key];
}
