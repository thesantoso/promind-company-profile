import { describe, expect, test } from 'vitest';
import { CONTENT_FILES, serializeContent, validateContent, type ContentKey } from '../src/content';
import { CONTENT_KEYS, real, realText } from './support/content';

const photos = new Set(real<{ image: { src: string } }[]>('fieldwork').map((f) => f.image.src));
const check = (key: ContentKey, data: unknown, known = photos) => validateContent(key, data, { knownImages: known });
const clone = <T,>(v: T): T => structuredClone(v);

describe('registry', () => {
  test('covers exactly the twelve content files', () => {
    expect(Object.keys(CONTENT_FILES).sort()).toEqual(CONTENT_KEYS);
    expect(CONTENT_KEYS).toHaveLength(12);
    for (const [key, f] of Object.entries(CONTENT_FILES)) expect(f.path).toBe(`web/content/${key}.json`);
  });
});

describe('real content', () => {
  test.each(CONTENT_KEYS)('%s validates with no issues', (key) => {
    expect(check(key as ContentKey, real(key))).toEqual([]);
  });

  test.each(CONTENT_KEYS)('%s round-trips byte for byte (publishing creates no noise diff)', (key) => {
    expect(serializeContent(real(key))).toBe(realText(key));
  });
});

describe('validation rules', () => {
  test('a blank English value is reported at its path', () => {
    const d = clone(real('services'));
    d[0].title.en = '   ';
    const issues = check('services', d);
    expect(issues.some((i) => i.path.includes('[0].title.en'))).toBe(true);
  });

  test('id and en lists of different length are rejected', () => {
    const d = clone(real('services'));
    d[0].deliverables.en.pop();
    expect(check('services', d)).not.toEqual([]);
  });

  test('duplicate slugs are reported (the old data had two hse-officer)', () => {
    const d = clone(real('careers'));
    d.push(clone(d[d.length - 1]));
    expect(check('careers', d).some((i) => /duplicate slug/i.test(i.message))).toBe(true);
  });

  test('mis-cased brand names are rejected', () => {
    const d = clone(real('portfolio'));
    d[0].scope.id = 'Dikelola oleh Promind sejak lama';
    expect(check('portfolio', d).some((i) => /brand/i.test(i.message))).toBe(true);
  });

  test('British spelling and bare OHS in English are rejected, but Indonesian is untouched', () => {
    const d = clone(real('careers'));
    d[0].summary.en = 'Runs the Training Centre and OHS programme';
    d[0].summary.id = 'Mengelola pusat pelatihan dan OHS';
    const msgs = check('careers', d).map((i) => i.message).join(' | ');
    expect(msgs).toMatch(/Centre/);
    expect(msgs).toMatch(/programme/);
    expect(msgs).toMatch(/OHS/);
    expect(check('careers', d).every((i) => i.path.includes('summary.en'))).toBe(true);
  });

  test('a field photo must exist in the repo or in the draft images', () => {
    const d = clone(real('fieldwork'));
    d[0].image.src = 'tidak-ada.jpg';
    expect(check('fieldwork', d).some((i) => /tidak-ada\.jpg/.test(i.message))).toBe(true);
    expect(check('fieldwork', d, new Set([...photos, 'tidak-ada.jpg']))).toEqual([]);
  });

  test('PROAPPS is refused anywhere (it must not appear on the public site)', () => {
    const d = clone(real('careers'));
    d[0].summary.id = 'Terbiasa dengan sistem seperti PROAPPS';
    d[0].summary.en = 'Comfortable with systems such as PROAPPS';
    const msgs = check('careers', d).map((i) => i.message);
    expect(msgs.filter((m) => /PROAPPS/.test(m) && /tidak boleh|not allowed|dilarang/i.test(m)).length).toBe(2);
  });

  test('wrong top-level shape is reported instead of throwing', () => {
    expect(check('services', { not: 'an array' }).length).toBeGreaterThan(0);
    expect(check('settings', [1, 2]).length).toBeGreaterThan(0);
    expect(check('services', null).length).toBeGreaterThan(0);
  });

  test('settings: the brand must be PROMIND and the email valid', () => {
    const s = clone(real('settings'));
    s.brand = 'Promind';
    s.email = 'bukan-email';
    expect(check('settings', s).length).toBeGreaterThanOrEqual(2);
  });

  test('pages: the hero call to action must point at a real route', () => {
    const p = clone(real('pages'));
    p.home.hero.cta.route = 'admin';
    expect(check('pages', p).length).toBeGreaterThan(0);
  });
});
