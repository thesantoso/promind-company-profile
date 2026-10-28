import { describe, expect, test } from 'vitest';
import { PAGE_SIZE, fillTemplate, paginate } from './paginate';

describe('paginate', () => {
  test('the production page size is 5, as on the live site', () => {
    expect(PAGE_SIZE).toBe(5);
  });

  test('five items or fewer need no controls', () => {
    for (const total of [0, 1, 5]) expect(paginate(total, 1).showControls, String(total)).toBe(false);
    expect(paginate(6, 1).showControls).toBe(true);
  });

  test('six items: 1 - 5 on page one, 6 - 6 on page two', () => {
    expect(paginate(6, 1)).toMatchObject({ page: 1, totalPages: 2, start: 1, end: 5, from: 0, to: 5, hasPrev: false, hasNext: true });
    expect(paginate(6, 2)).toMatchObject({ page: 2, totalPages: 2, start: 6, end: 6, from: 5, to: 6, hasPrev: true, hasNext: false });
  });

  test('exact multiples do not add an empty page', () => {
    expect(paginate(10, 2)).toMatchObject({ totalPages: 2, start: 6, end: 10 });
    expect(paginate(11, 3)).toMatchObject({ totalPages: 3, start: 11, end: 11 });
  });

  test('out-of-range pages are clamped', () => {
    expect(paginate(6, 0).page).toBe(1);
    expect(paginate(6, -3).page).toBe(1);
    expect(paginate(6, 99).page).toBe(2);
    expect(paginate(6, Number.NaN).page).toBe(1);
    expect(paginate(6, 1.9).page).toBe(1);
  });

  test('no items', () => {
    expect(paginate(0, 1)).toMatchObject({ page: 0, totalPages: 0, start: 0, end: 0, from: 0, to: 0, hasPrev: false, hasNext: false });
  });

  test('a custom page size (used by the tests)', () => {
    expect(paginate(5, 2, 2)).toMatchObject({ totalPages: 3, start: 3, end: 4, showControls: true });
    expect(paginate(5, 3, 2)).toMatchObject({ start: 5, end: 5 });
    expect(paginate(3, 1, 0).totalPages).toBe(3);
  });
});

describe('fillTemplate', () => {
  test('replaces known placeholders and leaves unknown ones', () => {
    expect(fillTemplate('Menampilkan {start} - {end} dari total {total} posisi', { start: 1, end: 5, total: 6 })).toBe('Menampilkan 1 - 5 dari total 6 posisi');
    expect(fillTemplate('Halaman {n} {x}', { n: 2 })).toBe('Halaman 2 {x}');
  });
});
