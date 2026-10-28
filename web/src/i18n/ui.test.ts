import { describe, expect, test } from 'vitest';
import { LOCALES } from './locales';
import { UI, t } from './ui';

describe('UI strings', () => {
  test('both locales define exactly the same keys', () => {
    expect(Object.keys(UI.en).sort()).toEqual(Object.keys(UI.id).sort());
  });

  test('no empty values', () => {
    for (const lang of LOCALES) {
      for (const [key, value] of Object.entries(UI[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('');
      }
    }
  });

  test('English is written, not copied from Indonesian', () => {
    for (const key of Object.keys(UI.id) as (keyof typeof UI.id)[]) {
      expect(UI.en[key], key).not.toBe(UI.id[key]);
    }
  });

  test('t looks up by locale', () => {
    expect(t('en', 'nav.about')).toBe('About');
    expect(t('id', 'nav.about')).toBe('Tentang Kami');
  });
});
