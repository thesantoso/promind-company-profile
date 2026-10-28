import { filterActiveJobs } from '../content/load';
import type { Job } from '../content/schema';
import { LOCALES, type Locale } from '../i18n/locales';
import { ROUTES, careerPath } from '../i18n/routes';

export interface JobStaticPath {
  lang: Locale;
  /** The `[...slug]` route param, e.g. `karir/building-manager`. */
  slug: string;
  job: Job;
}

/** One page per language for every open job. Inactive or expired jobs get no page. */
export function jobStaticPaths(jobs: Job[], today: string): JobStaticPath[] {
  return filterActiveJobs(jobs, today).flatMap((job) =>
    LOCALES.map((lang) => ({ lang, slug: `${ROUTES.careers[lang]}/${job.slug}`, job })),
  );
}

/** Per-language paths of every open job, for the sitemap. Same filter as the routes and the careers list. */
export function jobSitemapPaths(jobs: Job[], today: string): Record<Locale, string>[] {
  return filterActiveJobs(jobs, today).map((job) => ({ id: careerPath(job.slug, 'id'), en: careerPath(job.slug, 'en') }));
}
