import { describe, expect, test } from 'vitest';
import type { Job } from '../content/schema';
import { filterActiveJobs } from '../content/load';
import { jobSitemapPaths, jobStaticPaths } from './job-paths';

const bl = { id: 'x', en: 'y' };
const list = { id: ['a'], en: ['b'] };
const job = (over: Partial<Job>): Job => ({
  slug: 'a', title: bl, department: bl, type: bl, experience: bl, location: bl, summary: bl,
  responsibilities: list, qualifications: list, benefits: list,
  applicationEmail: 'recruitment@promind.co.id', postedAt: '2026-10-01', active: true, ...over,
});

describe('jobStaticPaths', () => {
  const today = '2026-10-28';

  test('creates one page per language with the translated careers slug', () => {
    const out = jobStaticPaths([job({ slug: 'building-manager' })], today);
    expect(out.map((p) => [p.lang, p.slug])).toEqual([
      ['id', 'karir/building-manager'],
      ['en', 'careers/building-manager'],
    ]);
  });

  test('creates no page for inactive or expired jobs', () => {
    const out = jobStaticPaths(
      [job({ slug: 'off', active: false }), job({ slug: 'old', validThrough: '2026-10-27' }), job({ slug: 'ok' })],
      today,
    );
    expect(new Set(out.map((p) => p.job.slug))).toEqual(new Set(['ok']));
  });
});

describe('one definition of "open job" everywhere', () => {
  const today = '2026-10-28';
  const jobs = [
    job({ slug: 'open' }),
    job({ slug: 'off', active: false }),
    job({ slug: 'old', validThrough: '2026-10-27' }),
    job({ slug: 'last-day', validThrough: today }),
  ];

  test('the careers list, the routes and the sitemap list the same jobs', () => {
    const list = filterActiveJobs(jobs, today).map((j) => j.slug).sort();
    const routes = [...new Set(jobStaticPaths(jobs, today).map((p) => p.job.slug))].sort();
    const sitemap = jobSitemapPaths(jobs, today).map((p) => p.id.split('/').pop() || p.id.split('/').slice(-2)[0]).sort();
    expect(list).toEqual(['last-day', 'open']);
    expect(routes).toEqual(list);
    expect(sitemap).toEqual(list);
  });
});
