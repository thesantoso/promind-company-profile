import { describe, expect, test } from 'vitest';
import { bilingualImage, bilingualText, loadSettings, siteSettingsSchema } from './schema';

const valid = () => structuredClone(loadSettings());

describe('bilingualText', () => {
  test('rejects a whitespace-only English value', () => {
    expect(bilingualText.safeParse({ id: 'Halo', en: '   ' }).success).toBe(false);
  });

  test('rejects an empty Indonesian value', () => {
    expect(bilingualText.safeParse({ id: '', en: 'Hi' }).success).toBe(false);
  });

  test('accepts both languages filled and trims them', () => {
    const parsed = bilingualText.parse({ id: ' Halo ', en: ' Hi ' });
    expect(parsed).toEqual({ id: 'Halo', en: 'Hi' });
  });
});

describe('bilingualImage', () => {
  test('requires alt text in both languages', () => {
    const r = bilingualImage.safeParse({ src: '/a.jpg', alt: { id: 'Gedung', en: '' } });
    expect(r.success).toBe(false);
  });
});

describe('siteSettings', () => {
  test('brand must be written PROMIND in capitals', () => {
    expect(siteSettingsSchema.safeParse({ ...valid(), brand: 'Promind' }).success).toBe(false);
  });

  test('rejects an invalid email', () => {
    expect(siteSettingsSchema.safeParse({ ...valid(), email: 'not-an-email' }).success).toBe(false);
  });

  test('loadSettings returns the validated settings file', () => {
    const s = loadSettings();
    expect(s.brand).toBe('PROMIND');
    expect(s.address.en.length).toBeGreaterThan(0);
  });
});
