import { describe, expect, test } from 'vitest';
import { assertUniqueSlugs, filterActiveJobs } from './load';
import type { Job } from './schema';

const bl = { id: 'x', en: 'y' };
const list = { id: ['a'], en: ['b'] };
const job = (over: Partial<Job>): Job => ({
  slug: 'a', title: bl, department: bl, type: bl, experience: bl, location: bl, summary: bl,
  responsibilities: list, qualifications: list, benefits: list,
  applicationEmail: 'recruitment@promind.co.id', postedAt: '2026-10-01', active: true, ...over,
});

describe('assertUniqueSlugs', () => {
  test('throws naming the duplicate slug', () => {
    expect(() => assertUniqueSlugs([{ slug: 'hse-officer' }, { slug: 'hse-officer' }])).toThrow(
      'duplicate slug: hse-officer',
    );
  });
  test('returns the items when unique', () => {
    const items = [{ slug: 'a' }, { slug: 'b' }];
    expect(assertUniqueSlugs(items)).toBe(items);
  });
});

describe('filterActiveJobs', () => {
  const today = '2026-10-28';
  test('drops inactive jobs and expired ones, keeps open-ended and future ones', () => {
    const jobs = [
      job({ slug: 'off', active: false }),
      job({ slug: 'expired', validThrough: '2026-10-01' }),
      job({ slug: 'future', validThrough: '2026-12-31' }),
      job({ slug: 'open' }),
      job({ slug: 'today', validThrough: today }),
    ];
    expect(filterActiveJobs(jobs, today).map((j) => j.slug)).toEqual(['future', 'open', 'today']);
  });
});
