import { describe, expect, test } from 'vitest';
import { deepEqual, emptyLike, isLongText, keysFor, moveItem, newItemFor, removeAt, shapeOf, type Json } from '../src/lib/shape';

describe('shapeOf', () => {
  test('recognises the content shapes', () => {
    expect(shapeOf({ id: 'a', en: 'b' }, 'title')).toBe('bilingual');
    expect(shapeOf({ id: ['a'], en: ['b'] }, 'responsibilities')).toBe('bilingualList');
    expect(shapeOf({ src: 'x.jpg', alt: { id: 'a', en: 'b' } }, 'image')).toBe('image');
    expect(shapeOf([{ a: 1 }], 'steps')).toBe('objectArray');
    expect(shapeOf(['a'], 'tags')).toBe('stringArray');
    expect(shapeOf({ seo: {} }, 'home')).toBe('object');
    expect(shapeOf('contact', 'route')).toBe('route');
    expect(shapeOf('2026-01-01', 'postedAt')).toBe('date');
    expect(shapeOf(undefined, 'validThrough')).toBe('date');
    expect(shapeOf('a@b.co', 'applicationEmail')).toBe('email');
    expect(shapeOf(true, 'active')).toBe('boolean');
    expect(shapeOf(3, 'n')).toBe('number');
    expect(shapeOf('x', 'name')).toBe('text');
  });

  test('isLongText', () => {
    expect(isLongText('summary', ['short'])).toBe(true);
    expect(isLongText('title', ['short'])).toBe(false);
    expect(isLongText('title', ['x'.repeat(81)])).toBe(true);
    expect(isLongText('name', ['x'.repeat(80)])).toBe(false);
  });
});

describe('emptyLike / newItemFor', () => {
  test('keeps the structure with empty values and one row per list', () => {
    const job = {
      slug: 'a', title: { id: 'A', en: 'A' }, responsibilities: { id: ['x', 'y'], en: ['x', 'y'] },
      postedAt: '2026-01-01', validThrough: '2026-02-01', active: true, n: 4,
    };
    expect(emptyLike(job)).toEqual({
      slug: '', title: { id: '', en: '' }, responsibilities: { id: [''], en: [''] },
      postedAt: '', validThrough: '', active: false, n: 0,
    });
    expect(emptyLike([])).toEqual([]);
  });

  test('does not mutate the template', () => {
    const t: Json = { a: { id: 'x', en: 'y' } };
    emptyLike(t);
    expect(t).toEqual({ a: { id: 'x', en: 'y' } });
  });

  test('careers items get today as postedAt, are inactive, and omit validThrough', () => {
    const item = newItemFor('careers', { slug: 's', postedAt: '2020-01-01', validThrough: '2020-02-02', active: true }, '2026-10-28');
    expect(item).toEqual({ slug: '', postedAt: '2026-10-28', active: false });
    expect(newItemFor('pillars', { slug: 's' }, '2026-10-28')).toEqual({ slug: '' });
  });
});

describe('keysFor', () => {
  test('inserts optional keys after their anchor for root items only', () => {
    expect(keysFor({ slug: '', postedAt: '', active: true }, 'careers', true)).toEqual(['slug', 'postedAt', 'validThrough', 'active']);
    expect(keysFor({ slug: '', postedAt: '', validThrough: 'x', active: true }, 'careers', true)).toEqual(['slug', 'postedAt', 'validThrough', 'active']);
    expect(keysFor({ slug: '' }, 'careers', false)).toEqual(['slug']);
    expect(keysFor({ slug: '' }, 'pillars', true)).toEqual(['slug']);
  });
});

describe('array helpers', () => {
  test('moveItem / removeAt / deepEqual', () => {
    expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(removeAt([1, 2, 3], 1)).toEqual([1, 3]);
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
  });
});
