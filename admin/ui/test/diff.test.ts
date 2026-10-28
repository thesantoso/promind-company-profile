import { describe, expect, test } from 'vitest';
import { buildDiff } from '../src/lib/diff';
import { humanPath, humanizeKey, itemSummary } from '../src/lib/labels';

const job = (title: string) => ({ slug: 'x', title: { id: title, en: title }, list: { id: ['a'], en: ['a'] }, active: true });

describe('buildDiff', () => {
  test('reports changed leaves with readable labels', () => {
    const before = [job('Building Manager')];
    const after = [{ ...job('Building Manager'), title: { id: 'Building Manager', en: 'Site Manager' } }];
    const d = buildDiff(before, after, 'careers');
    expect(d).toEqual([
      { path: '[0].title.en', label: 'Lowongan 1 (Building Manager) › Judul › English (US)', kind: 'changed', before: 'Building Manager', after: 'Site Manager' },
    ]);
  });

  test('added and removed items, list rows, booleans and removed keys', () => {
    const before = [job('A'), job('B')];
    const after = [{ ...job('A'), active: false, list: { id: ['a', 'b'], en: ['a', 'b'] } }];
    const d = buildDiff(before, after, 'careers');
    expect(d.map((e) => [e.path, e.kind, e.before, e.after])).toEqual([
      ['[0].list.id[1]', 'added', null, 'b'],
      ['[0].list.en[1]', 'added', null, 'b'],
      ['[0].active', 'changed', 'Ya', 'Tidak'],
      ['[1]', 'removed', 'B', null],
    ]);
    expect(d[0]!.label).toBe('Lowongan 1 (A) › List › Indonesia › baris 2');
  });

  test('optional key added', () => {
    const d = buildDiff([{ postedAt: '2026-01-01' }], [{ postedAt: '2026-01-01', validThrough: '2026-12-31' }], 'careers');
    expect(d).toEqual([{ path: '[0].validThrough', label: 'Lowongan 1 › Berlaku sampai (opsional)', kind: 'added', before: null, after: '2026-12-31' }]);
  });

  test('no changes → empty list', () => {
    expect(buildDiff({ a: { id: 'x', en: 'y' } }, { a: { id: 'x', en: 'y' } }, 'pages')).toEqual([]);
  });
});

describe('labels', () => {
  test('humanPath for nested objects', () => {
    expect(humanPath('home.hero.cta.route', 'pages')).toBe('Beranda › Banner utama › Tombol ajakan › Halaman tujuan');
    expect(humanPath('', 'pages')).toBe('Seluruh berkas');
    expect(humanPath('home.technology.steps[1].title.id', 'pages')).toBe('Beranda › Bagian Teknologi › Langkah › Langkah 2 › Judul › Indonesia');
  });
  test('humanizeKey falls back to words', () => {
    expect(humanizeKey('someNewKey')).toBe('Some new key');
    expect(humanizeKey('title')).toBe('Judul');
  });
  test('itemSummary prefers title.id, then name, slug, code', () => {
    expect(itemSummary({ title: { id: 'A', en: 'B' }, slug: 's' })).toBe('A');
    expect(itemSummary({ name: 'N', code: 'C' })).toBe('N');
    expect(itemSummary({ code: 'ISO', name: { id: 'Q', en: 'Q' } })).toBe('Q');
    expect(itemSummary({ code: 'ISO' })).toBe('ISO');
    expect(itemSummary({})).toBeNull();
  });
});
