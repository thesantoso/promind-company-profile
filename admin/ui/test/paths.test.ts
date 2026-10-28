import { describe, expect, test } from 'vitest';
import { closestPath, fieldId, formatPath, getIn, issuesAt, joinPath, parentPath, parsePath } from '../src/lib/paths';

describe('paths', () => {
  test('joinPath builds the server format', () => {
    expect(joinPath('', 2)).toBe('[2]');
    expect(joinPath('[2]', 'title')).toBe('[2].title');
    expect(joinPath('[2].title', 'en')).toBe('[2].title.en');
    expect(joinPath('', 'home')).toBe('home');
    expect(joinPath('list.en', 1)).toBe('list.en[1]');
  });

  test('parsePath / formatPath round-trip', () => {
    for (const p of ['[2].title.en', 'list.en[1]', 'home.hero.cta.route', '[0].responsibilities.en[3]', 'home.technology.steps[2].summary.id', '']) {
      expect(formatPath(parsePath(p))).toBe(p);
    }
    expect(parsePath('[0].responsibilities.en[3]')).toEqual([0, 'responsibilities', 'en', 3]);
  });

  test('parentPath walks up', () => {
    expect(parentPath('[2].title.en')).toBe('[2].title');
    expect(parentPath('[2]')).toBe('');
    expect(parentPath('')).toBeNull();
  });

  test('fieldId is unique and DOM-safe', () => {
    const ids = ['[2].title.en', '[2]_title.en', '2.title.en', 'a.b', 'a-b'].map(fieldId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
  });

  test('issuesAt matches exactly; closestPath falls back to ancestors', () => {
    const issues = [{ path: '[1].title.en', message: 'x' }, { path: '[1].title', message: 'y' }];
    expect(issuesAt(issues, '[1].title.en')).toHaveLength(1);
    expect(issuesAt(issues, '[1]')).toHaveLength(0);
    const known = new Set(['[1]', '[1].slug', '']);
    expect(closestPath('[1].title.en', (p) => known.has(p))).toBe('[1]');
    expect(closestPath('[1].slug', (p) => known.has(p))).toBe('[1].slug');
    expect(closestPath('[9].x', () => false)).toBeNull();
  });

  test('getIn', () => {
    expect(getIn({ a: [{ b: 1 }] }, ['a', 0, 'b'])).toBe(1);
    expect(getIn({ a: 1 }, ['a', 'b'])).toBeUndefined();
  });
});
