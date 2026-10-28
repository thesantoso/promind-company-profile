import type { APIRoute } from 'astro';
import { loadActiveJobs } from '../content/load';
import { careerPath } from '../i18n/routes';
import { buildSitemap } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  const today = new Date().toISOString().slice(0, 10);
  const jobs = loadActiveJobs(today).map((j) => ({ id: careerPath(j.slug, 'id'), en: careerPath(j.slug, 'en') }));
  return new Response(buildSitemap(site!.href, jobs), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
