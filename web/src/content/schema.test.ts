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

import { blList, dateOnly, jobSchema, slug } from './schema';

describe('blList', () => {
  test('rejects mismatched lengths between languages', () => {
    expect(blList.safeParse({ id: ['a', 'b'], en: ['a'] }).success).toBe(false);
  });

  test('rejects an empty list and blank items', () => {
    expect(blList.safeParse({ id: [], en: [] }).success).toBe(false);
    expect(blList.safeParse({ id: ['a'], en: ['  '] }).success).toBe(false);
  });

  test('accepts aligned lists', () => {
    expect(blList.safeParse({ id: ['a'], en: ['b'] }).success).toBe(true);
  });
});

describe('slug and dateOnly', () => {
  test.each(['building-manager', 'a1', 'hse-officer'])('slug accepts %s', (v) => {
    expect(slug.safeParse(v).success).toBe(true);
  });
  test.each(['Building', 'a_b', '-a', 'a--b ', ''])('slug rejects %j', (v) => {
    expect(slug.safeParse(v).success).toBe(false);
  });
  test('dateOnly accepts YYYY-MM-DD only', () => {
    expect(dateOnly.safeParse('2026-10-28').success).toBe(true);
    expect(dateOnly.safeParse('2026-10-28T00:30:00+07:00').success).toBe(false);
    expect(dateOnly.safeParse('2026-13-40').success).toBe(false);
  });
});

describe('jobSchema', () => {
  const bl = { id: 'x', en: 'y' };
  const list = { id: ['a'], en: ['b'] };
  const job = {
    slug: 'building-manager', title: bl, department: bl, type: bl, experience: bl, location: bl, summary: bl,
    responsibilities: list, qualifications: list, benefits: list,
    applicationEmail: 'recruitment@promind.co.id', postedAt: '2026-10-28', active: true,
  };
  test('accepts a complete job without validThrough', () => {
    expect(jobSchema.safeParse(job).success).toBe(true);
  });
  test('rejects a datetime in postedAt', () => {
    expect(jobSchema.safeParse({ ...job, postedAt: '2026-10-28T00:00:00Z' }).success).toBe(false);
  });
});
